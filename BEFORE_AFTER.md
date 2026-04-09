# Before / After Comparison

## Build Failures

### BEFORE
```python
build = project.get("build")
if ptype in ("generator_merge_build", "command_only") and build:
    run(build["command"], cwd=build["cwd"])  # ← doesn't check return code
    git_commit(project)  # ← always runs, even if build failed
print("\nAll enabled projects processed.")
```

**Risk:** Failed build → broken code pushed to production

### AFTER
```python
if ptype in ("generator_merge_build", "command_only") and build:
    logger.info(f"\nPhase 3: Build")
    result = run(build["command"], cwd=build["cwd"], timeout=600, check=False)
    if result.returncode != 0:
        logger.error("Build FAILED. Not committing.")
        raise RuntimeError("Build failed")
    logger.info("Build succeeded ✓")
```

**Safety:** Build must return 0; any failure aborts before commit/push

---

## File Glob Race

### BEFORE
```python
def latest_file(pattern):
    files = glob.glob(expand(pattern))
    if not files: raise FileNotFoundError(pattern)
    files.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return files[0]  # ← picks newest by mtime (unreliable)

# Called as:
src = latest_file(merge["output_glob"])  # glob pattern with wildcards
```

**Risk:** Multiple outputs per run → picks stale file

### AFTER
```json
"output_glob": "~/projects/cardsnap/seo-engine/outputs/cardsnap/generated.json"
```

**Safety:** Single deterministic filename; no glob ambiguity

---

## JSON Validation

### BEFORE
```python
def merge_cardsnap(src, target):
    items = json.loads(Path(src).read_text())  # ← no schema validation
    cleaned = {i["slug"]: i for i in items}  # ← assumes all have slug
    Path(expand(target)).write_text(
        "// AUTO-GENERATED\n\nexport const GENERATED_NICHE_CONTENT = " +
        json.dumps(cleaned, indent=2) + ";\n"
    )
```

**Risk:** Empty/incomplete JSON → TypeScript compile fails downstream

### AFTER
```python
def validate_json_schema(data: list, schema: Dict[str, Any]) -> None:
    if not isinstance(data, list) or len(data) == 0:
        raise ValueError("Generator output must be non-empty list")
    required_fields = schema.get("required_fields", [])
    for idx, item in enumerate(data):
        for field in required_fields:
            if field not in item:
                raise ValueError(f"Item {idx} missing required field: {field}")

def merge_cardsnap(src: str, target: str, schema: Dict[str, Any]) -> None:
    items = json.loads(Path(src).read_text())
    validate_json_schema(items, schema)  # ← fail early
    # ... then merge
```

**Safety:** Validate before merge; fail fast if incomplete

---

## Concurrent Execution

### BEFORE
```python
cfg = json.loads(CONFIG_PATH.read_text())
for name, project in cfg.items():
    if not project.get("enabled"): continue
    print(f"\n===== PROJECT: {name} =====")
    # ... process project
```

**Risk:** Multiple Hermes instances can run simultaneously → git push conflicts

### AFTER
```python
def process_project(name: str, project: Dict[str, Any]) -> None:
    logger.info(f"PROJECT: {name}")
    lock_file = acquire_lock(name)  # ← exclusive lock
    try:
        # ... process project
    finally:
        release_lock(lock_file)

def acquire_lock(project_name: str) -> fcntl.LOCK_EX:
    lock_path = LOCK_DIR / f"{project_name}.lock"
    lock_file = open(lock_path, "w")
    fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    return lock_file
```

**Safety:** Only one instance per project at a time

---

## Commit Safety

### BEFORE
```python
def git_commit(project):
    git = project.get("git", {})
    cwd = git.get("cwd")
    add_list = git.get("add", [])
    msg = git.get("commit_message", "seo batch")
    if add_list:
        run("git add " + " ".join([f'"{p}"' for p in add_list]), cwd=cwd)
    else:
        run("git add .", cwd=cwd)
    run(f'git commit -m "{msg}"', cwd=cwd, allow_fail=True)  # ← ignores failure
    run("git push", cwd=cwd)  # ← always pushes
```

**Risk:** Commit fails (merge conflict, detached HEAD) → push still happens on dirty state

### AFTER
```python
def git_commit_and_push(project: Dict[str, Any], batch_id: str) -> None:
    git = project.get("git", {})
    cwd = git.get("cwd")
    add_list = git.get("add", [])
    base_msg = git.get("commit_message", "seo batch")
    msg = f"{base_msg} [{batch_id}]"

    if add_list:
        run(["git", "add"] + add_list, cwd=cwd)  # ← array, not shell (no injection)
    else:
        run(["git", "add", "."], cwd=cwd)

    result = run("git status --porcelain", cwd=cwd, check=False)
    if not result.stdout.strip():
        logger.info("Nothing to commit")
        return

    run(["git", "commit", "-m", msg], cwd=cwd)  # ← no allow_fail
    logger.info("Pushing to remote...")
    run(["git", "push"], cwd=cwd)  # ← only if commit succeeded
```

**Safety:** Commit must succeed; push only if commit succeeded

---

## Health Checks

### BEFORE
```python
print("\nAll enabled projects processed.")
# seo_verify_urls.py runs later (async)
```

**Risk:** Broken pages are pushed; health check is deferred

### AFTER
```python
# === PHASE 4: Health Check ===
if not skip_health_check and project.get("priority_urls"):
    logger.info(f"\nPhase 4: Health Check")
    if not verify_pages(project["priority_urls"]):
        raise RuntimeError("Page verification failed")

# === PHASE 5: Commit & Push ===
if ptype in ("generator_merge_build", "command_only"):
    logger.info(f"\nPhase 5: Commit & Push")
    git_commit_and_push(project, batch_id)
```

**Safety:** Health check runs **before** push; pages verified to be live

---

## Git State

### BEFORE
```python
def git_commit(project):
    git = project.get("git", {})
    cwd = git.get("cwd")
    # ... assumes repo is clean, on main branch, no conflicts
    run("git add .", cwd=cwd)  # ← commits everything if dirty from previous run
```

**Risk:** Previous batch left dirty state → unrelated files committed

### AFTER
```python
cwd_build = expand(project.get("repo_root") or build.get("cwd"))
if not check_git_status(cwd_build):
    raise RuntimeError("Repo has uncommitted changes; manual cleanup required")

def check_git_status(cwd: str) -> bool:
    result = run("git status --porcelain", cwd=cwd, check=False)
    if result.stdout.strip():
        logger.error(f"Repo has uncommitted changes:\n{result.stdout}")
        return False
    return True
```

**Safety:** Fail if repo isn't clean; operator must fix manually

---

## Error Handling

### BEFORE
```python
cfg = json.loads(CONFIG_PATH.read_text())
for name, project in cfg.items():
    if not project.get("enabled"): continue
    print(f"\n===== PROJECT: {name} =====")
    ptype = project.get("type")
    # ... if any step fails, exception propagates; no tracking
print("\nAll enabled projects processed.")  # ← printed even if one failed
```

**Risk:** First failure stops entire batch; unclear which projects succeeded

### AFTER
```python
failed = []
for name, project in cfg.items():
    if args.project and name != args.project:
        continue
    try:
        process_project(name, project, skip_health_check=args.skip_health_check)
    except Exception as e:
        logger.error(f"{name} failed: {e}")
        failed.append((name, str(e)))

logger.info(f"\n{'='*60}")
if failed:
    logger.error(f"FAILED: {len(failed)} projects")
    for name, error in failed:
        logger.error(f"  - {name}: {error}")
    sys.exit(1)
else:
    logger.info(f"SUCCESS: All projects processed")
    sys.exit(0)
```

**Safety:** Log all failures; exit with proper code; clear summary

---

## Shell Injection

### BEFORE
```python
def git_commit(project):
    git = project.get("git", {})
    add_list = git.get("add", [])
    # user-controlled paths in f-string:
    run("git add " + " ".join([f'"{p}"' for p in add_list]), cwd=cwd)
    # if add_list = ['path"with quote'], command becomes: git add "path"with quote"
    # ↓ shell interprets as: git add [path] [with] [quote] (syntax error or worse)
```

**Risk:** Malformed path → command injection or failure

### AFTER
```python
run(["git", "add"] + add_list, cwd=cwd)  # subprocess array (no shell parsing)
```

**Safety:** No shell interpretation; paths treated as literals

---

## Timeouts

### BEFORE
```python
def run(cmd, cwd=None, allow_fail=False):
    r = subprocess.run(cmd, shell=True, cwd=expand(cwd) if cwd else None)
    # no timeout
```

**Risk:** Generator/build hangs forever; Hermes can't interrupt

### AFTER
```python
def run(cmd, cwd=None, timeout=300, check=True):
    result = subprocess.run(
        cmd_list,
        cwd=cwd_exp,
        timeout=timeout,  # ← default 5 min
        capture_output=True,
        text=True,
        check=False
    )
    # ...
    run(gen["command"], cwd=gen["cwd"], timeout=600)  # 10 min for generator
    run(build["command"], cwd=build["cwd"], timeout=600)  # 10 min for build
```

**Safety:** All subprocess calls have timeout

---

## Summary

| Issue | Before | After | Severity |
|-------|--------|-------|----------|
| Build fails but pushes | ❌ Broken | ✓ Aborts | CRITICAL |
| Glob picks wrong file | ❌ Race | ✓ Deterministic | CRITICAL |
| JSON not validated | ❌ Broken | ✓ Schema validated | CRITICAL |
| Concurrent runs conflict | ❌ Race | ✓ Flock protected | CRITICAL |
| Commit fails but pushes | ❌ Broken | ✓ Fails hard | CRITICAL |
| Pages not verified | ❌ Hidden | ✓ Health check | CRITICAL |
| Shell injection risk | ❌ Vulnerable | ✓ Array args | HIGH |
| No timeout | ❌ Hangs | ✓ 5-10 min | HIGH |
| Dirty repo state | ❌ Unsafe | ✓ Checked | MEDIUM |
| Partial failure opaque | ❌ Silent | ✓ Logged | MEDIUM |
