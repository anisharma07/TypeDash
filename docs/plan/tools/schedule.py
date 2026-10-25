#!/usr/bin/env python3
"""Derive the TypeDash schedule from docs/plan/07-backlog.md.

Usage:  python3 docs/plan/tools/schedule.py [--lanes 1,2,3] [--buffer 0.25]

Reads every backlog row (ID | Size | Task | Deps | ...), walks the dependency
graph, and list-schedules the core tasks (M0-M7) onto N parallel "lanes" in
milestone order. Growth (G-*) tasks run alongside and are excluded.

Size -> focused developer-days (incl. review and fixes): S=0.5 M=1 L=2 XL=3.
Weeks are 5 working days, always rounded UP ("finishes during week N").
"""
import argparse, collections, math, pathlib, re, sys

DAYS = {"S": 0.5, "M": 1, "L": 2, "XL": 3}
BACKLOG = pathlib.Path(__file__).resolve().parents[1] / "07-backlog.md"


def load():
    rows = {}
    for line in BACKLOG.read_text().splitlines():
        m = re.match(r"\| ((?:M[0-7]|G)-\d+) \| (S|M|L|XL) \| ", line)
        if not m:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        rows[m.group(1)] = (DAYS[m.group(2)], cells[3])
    return rows


def build(rows):
    by_ms = collections.defaultdict(list)
    for i in rows:
        by_ms[i.split("-")[0]].append(i)
    core = [i for i in rows if not i.startswith("G-")]

    def deps_of(i):
        text = rows[i][1].strip()
        out = set(re.findall(r"(?:M[0-7]|G)-\d+", text))
        if re.fullmatch(r"M\d", text):            # whole milestone
            out |= set(by_ms[text])
        if text.startswith("all M"):               # "all M3"
            out |= {x for x in by_ms[text.split()[1]] if x != i}
        return {d for d in out if d in core}

    return core, {i: deps_of(i) for i in core}


def check(core, deps):
    ids = set(core)
    for i, ds in deps.items():
        assert ds <= ids, f"{i} has unknown deps {ds - ids}"
    # cycle check (Kahn)
    indeg = {i: len(ds) for i, ds in deps.items()}
    q = [i for i, n in indeg.items() if n == 0]
    seen = 0
    succ = collections.defaultdict(set)
    for i, ds in deps.items():
        for d in ds:
            succ[d].add(i)
    while q:
        n = q.pop()
        seen += 1
        for s in succ[n]:
            indeg[s] -= 1
            if indeg[s] == 0:
                q.append(s)
    if seen != len(core):
        sys.exit("dependency cycle detected")
    return succ


def schedule(rows, core, deps, succ, lanes):
    tail = {}

    def T(i):
        if i not in tail:
            tail[i] = rows[i][0] + max([T(s) for s in succ[i]] + [0])
        return tail[i]

    for i in core:
        T(i)
    done, running, t, pending = {}, [], 0.0, set(core)
    while pending or running:
        ready = sorted(
            (i for i in pending if all(d in done for d in deps[i])),
            key=lambda i: (int(i[1]), -tail[i]),
        )
        while len(running) < lanes and ready:
            i = ready.pop(0)
            pending.remove(i)
            running.append((t + rows[i][0], i))
        running.sort()
        t, i = running.pop(0)
        done[i] = t
        while running and running[0][0] <= t:
            tt, j = running.pop(0)
            done[j] = tt
    finish = {}
    for i, tm in done.items():
        m = i.split("-")[0]
        finish[m] = max(finish.get(m, 0), tm)
    return finish, tail


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lanes", default="1,2")
    ap.add_argument("--buffer", type=float, default=0.25)
    a = ap.parse_args()
    rows = load()
    core, deps = build(rows)
    succ = check(core, deps)
    effort = collections.Counter()
    count = collections.Counter()
    for i, (d, _) in rows.items():
        effort[i.split("-")[0]] += d
        count[i.split("-")[0]] += 1
    print(f"{len(rows)} tasks ({len(core)} core), "
          f"{sum(v for k, v in effort.items() if k != 'G')} core dev-days\n")
    _, tail = schedule(rows, core, deps, succ, 1)
    print(f"Critical path (unlimited lanes): {max(tail.values())} days "
          f"= {math.ceil(max(tail.values()) / 5)} weeks\n")
    lanes = [int(x) for x in a.lanes.split(",")]
    head = "Milestone  tasks  days " + "".join(
        f"| {n} lane{'s' if n > 1 else ' '}: wk / +{int(a.buffer * 100)}% " for n in lanes)
    print(head)
    fin = {n: schedule(rows, core, deps, succ, n)[0] for n in lanes}
    for m in sorted(effort):
        line = f"{m:<10} {count[m]:>5} {effort[m]:>5} "
        if m == "G":
            line += "| runs alongside"
        else:
            for n in lanes:
                w = fin[n][m] / 5
                line += f"| {math.ceil(w):>3} / {math.ceil(w * (1 + a.buffer)):<3}            "
        print(line)


if __name__ == "__main__":
    main()
