#!/usr/bin/env python3
import argparse, glob, json, os, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "projects.json"

def expand(p): return os.path.expanduser(p)

def run(cmd, cwd=None, allow_fail=False):
    print(f"\n>>> {cmd}")
    r = subprocess.run(cmd, shell=True, cwd=expand(cwd) if cwd else None)
    if r.returncode != 0 and not allow_fail:
        raise SystemExit(r.returncode)

def latest_file(pattern):
    files = glob.glob(expand(pattern))
    if not files:
        raise FileNotFoundError(pattern)
    files.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return files[0]

def merge_snapbrand(src, target):
    items = json.loads(Path(src).read_text())
    cleaned = {}
    for i in items:
        slug = i["slug"]
        rest = dict(i)
        rest.pop("slug", None); rest.pop("schema_jsonld", None); rest.pop("_meta", None)
        cleaned[slug] = rest
    Path(expand(target)).write_text("// AUTO-GENERATED\n\nexport const GENERATED_BUSINESS_TYPES = " + json.dumps(cleaned, indent=2) + ";\n")

def merge_cardsnap(src, target):
    items = json.loads(Path(src).read_text())
    cleaned = {i["slug"]: i for i in items}
    Path(expand(target)).write_text("// AUTO-GENERATED\n\nexport const GENERATED_NICHE_CONTENT = " + json.dumps(cleaned, indent=2) + ";\n")

def git_commit(project):
    git = project.get("git", {})
    cwd = git.get("cwd")
    add_list = git.get("add", [])
    msg = git.get("commit_message", "seo batch")
    if add_list:
        run("git add " + " ".join([f'"{p}"' for p in add_list]), cwd=cwd)
    else:
        run("git add .", cwd=cwd)
    run(f'git commit -m "{msg}"', cwd=cwd, allow_fail=True)
    run("git push", cwd=cwd)

cfg = json.loads(CONFIG_PATH.read_text())
for name, project in cfg.items():
    if not project.get("enabled"): continue
    print(f"\n===== PROJECT: {name} =====")
    ptype = project.get("type")
    gen = project.get("generator")
    if ptype in ("generator_merge_build", "command_only") and gen:
        run(gen["command"], cwd=gen["cwd"])
    if ptype == "generator_merge_build":
        merge = project["merge"]
        src = latest_file(merge["output_glob"])
        if merge["type"] == "snapbrand_generated_types":
            merge_snapbrand(src, merge["target_file"])
        elif merge["type"] == "cardsnap_generated_niche_content":
            merge_cardsnap(src, merge["target_file"])
    build = project.get("build")
    if ptype in ("generator_merge_build", "command_only") and build:
        run(build["command"], cwd=build["cwd"])
        git_commit(project)
print("\nAll enabled projects processed.")
