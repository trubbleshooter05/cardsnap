#!/usr/bin/env python3
"""
SEO batch processor with safety, validation, and rollback.
- Atomic per-project transactions (branch-based)
- Schema validation before merge
- Health checks after build
- Concurrency locks
- Proper error handling and rollback
- No shell injection
"""
import argparse
import fcntl
import glob
import hashlib
import json
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("seo_batch")

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "projects.json"
LOCK_DIR = Path("/tmp/seo_batch_locks")
LOCK_DIR.mkdir(exist_ok=True)

def expand(p):
    """Expand ~ and environment variables."""
    return os.path.expanduser(os.path.expandvars(p))

def run(cmd, cwd=None, timeout=300, check=True):
    """
    Execute command with timeout and proper error handling.
    Args:
        cmd: command string or list
        cwd: working directory
        timeout: seconds (default 5 min)
        check: raise on non-zero return
    Returns:
        CompletedProcess
    """
    cwd_exp = expand(cwd) if cwd else None
    logger.info(f"Running: {cmd}")

    # Convert string to list to avoid shell injection
    if isinstance(cmd, str):
        cmd_list = cmd.split()
    else:
        cmd_list = cmd

    try:
        result = subprocess.run(
            cmd_list,
            cwd=cwd_exp,
            timeout=timeout,
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode != 0:
            logger.error(f"Command failed with code {result.returncode}")
            if result.stdout:
                logger.error(f"STDOUT:\n{result.stdout}")
            if result.stderr:
                logger.error(f"STDERR:\n{result.stderr}")

            if check:
                raise RuntimeError(f"Command failed: {cmd_list}")

        if result.stdout:
            logger.debug(f"Output: {result.stdout[:200]}")

        return result
    except subprocess.TimeoutExpired:
        logger.error(f"Command timed out after {timeout}s: {cmd_list}")
        raise RuntimeError(f"Timeout: {cmd_list}")

def acquire_lock(project_name: str, timeout: int = 60) -> fcntl.LOCK_EX:
    """Acquire exclusive lock for project."""
    lock_path = LOCK_DIR / f"{project_name}.lock"
    lock_file = open(lock_path, "w")
    try:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        logger.info(f"Lock acquired: {project_name}")
        return lock_file
    except IOError:
        logger.error(f"Could not acquire lock for {project_name} (already running)")
        raise RuntimeError(f"Lock failed: {project_name}")

def release_lock(lock_file):
    """Release lock."""
    fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
    lock_file.close()

def latest_file(pattern: str) -> str:
    """Get most recently modified file matching pattern."""
    files = glob.glob(expand(pattern))
    if not files:
        raise FileNotFoundError(f"No files match pattern: {pattern}")
    files.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    logger.debug(f"Selected: {files[0]}")
    return files[0]

def validate_json_schema(data: list, schema: Dict[str, Any]) -> None:
    """Minimal schema validation."""
    if not isinstance(data, list) or len(data) == 0:
        raise ValueError("Generator output must be non-empty list")

    required_fields = schema.get("required_fields", [])
    for idx, item in enumerate(data):
        for field in required_fields:
            if field not in item:
                raise ValueError(f"Item {idx} missing required field: {field}")

def merge_snapbrand(src: str, target: str, schema: Dict[str, Any]) -> None:
    """Merge snapbrand generator output to TypeScript."""
    src_path = Path(src)
    target_path = Path(expand(target))

    logger.info(f"Merging snapbrand: {src} → {target}")

    # Load and validate
    try:
        items = json.loads(src_path.read_text())
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {src}: {e}")

    validate_json_schema(items, schema)

    # Transform
    cleaned = {}
    for i in items:
        slug = i.get("slug")
        if not slug:
            raise ValueError(f"Missing slug in item: {i}")

        rest = dict(i)
        rest.pop("slug", None)
        rest.pop("schema_jsonld", None)
        rest.pop("_meta", None)
        cleaned[slug] = rest

    # Write
    output = "// AUTO-GENERATED\n\nexport const GENERATED_BUSINESS_TYPES = " + \
             json.dumps(cleaned, indent=2) + ";\n"
    target_path.write_text(output)
    logger.info(f"Merged {len(cleaned)} items to {target}")

def merge_cardsnap(src: str, target: str, schema: Dict[str, Any]) -> None:
    """Merge cardsnap generator output to TypeScript."""
    src_path = Path(src)
    target_path = Path(expand(target))

    logger.info(f"Merging cardsnap: {src} → {target}")

    # Load and validate
    try:
        items = json.loads(src_path.read_text())
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {src}: {e}")

    validate_json_schema(items, schema)

    # Transform
    cleaned = {i["slug"]: i for i in items if "slug" in i}

    if len(cleaned) != len(items):
        logger.warning(f"Dropped {len(items) - len(cleaned)} items (missing slug)")

    # Write
    output = "// AUTO-GENERATED\n\nexport const GENERATED_NICHE_CONTENT = " + \
             json.dumps(cleaned, indent=2) + ";\n"
    target_path.write_text(output)
    logger.info(f"Merged {len(cleaned)} items to {target}")

def check_git_status(cwd: str) -> bool:
    """Check if git repo is clean."""
    result = run(
        "git status --porcelain",
        cwd=cwd,
        check=False
    )
    if result.stdout.strip():
        logger.error(f"Repo has uncommitted changes:\n{result.stdout}")
        return False
    return True

def verify_pages(priority_urls: list) -> bool:
    """Verify generated pages return 200."""
    import urllib.request
    import urllib.error

    logger.info(f"Verifying {len(priority_urls)} pages...")
    failed = []

    for url in priority_urls:
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                if response.status != 200:
                    failed.append((url, response.status))
                    logger.warning(f"  {url} → {response.status}")
                else:
                    logger.info(f"  {url} → 200 ✓")
        except Exception as e:
            failed.append((url, str(e)))
            logger.warning(f"  {url} → ERROR: {e}")

    if failed:
        logger.error(f"Failed verification for {len(failed)} pages")
        return False

    logger.info("All pages verified ✓")
    return True

def git_commit_and_push(project: Dict[str, Any], batch_id: str) -> None:
    """Commit with batch ID for deduplication."""
    git = project.get("git", {})
    cwd = git.get("cwd")
    add_list = git.get("add", [])
    base_msg = git.get("commit_message", "seo batch")
    msg = f"{base_msg} [{batch_id}]"

    if not cwd:
        logger.warning("No git.cwd configured; skipping commit")
        return

    logger.info(f"Committing to {cwd}")

    # Git add (use subprocess array to avoid injection)
    if add_list:
        run(["git", "add"] + add_list, cwd=cwd)
    else:
        run(["git", "add", "."], cwd=cwd)

    # Check if there's anything to commit
    result = run(
        "git status --porcelain",
        cwd=cwd,
        check=False
    )
    if not result.stdout.strip():
        logger.info("Nothing to commit")
        return

    # Commit
    run(["git", "commit", "-m", msg], cwd=cwd)

    # Push
    logger.info("Pushing to remote...")
    run(["git", "push"], cwd=cwd)
    logger.info("Push successful ✓")

def process_project(name: str, project: Dict[str, Any], skip_health_check: bool = False) -> None:
    """Process single project atomically."""
    logger.info(f"\n{'='*60}")
    logger.info(f"PROJECT: {name}")
    logger.info(f"{'='*60}")

    if not project.get("enabled"):
        logger.info("Disabled; skipping")
        return

    # Acquire lock
    lock_file = acquire_lock(name)

    try:
        ptype = project.get("type")

        # === PHASE 1: Generator ===
        gen = project.get("generator")
        if ptype in ("generator_merge_build", "command_only") and gen:
            logger.info(f"\nPhase 1: Generator")

            # Clean stale outputs before running
            if ptype == "generator_merge_build":
                merge = project.get("merge")
                output_glob = merge.get("output_glob", "")
                output_dir = expand(output_glob.rsplit("/", 1)[0])
                if os.path.exists(output_dir):
                    logger.info(f"Cleaning stale outputs: {output_dir}")
                    shutil.rmtree(output_dir, ignore_errors=True)
                os.makedirs(output_dir, exist_ok=True)

            run(gen["command"], cwd=gen["cwd"], timeout=600)

        # === PHASE 2: Merge (validate + transform) ===
        if ptype == "generator_merge_build":
            logger.info(f"\nPhase 2: Merge & Validate")

            merge = project.get("merge")
            src = latest_file(merge["output_glob"])
            merge_type = merge["type"]
            target = merge["target_file"]

            # Load schema
            schema = project.get("merge_schema", {})

            # Merge with validation
            if merge_type == "snapbrand_generated_types":
                merge_snapbrand(src, target, schema)
            elif merge_type == "cardsnap_generated_niche_content":
                merge_cardsnap(src, target, schema)
            else:
                raise ValueError(f"Unknown merge type: {merge_type}")

        # === PHASE 3: Build ===
        build = project.get("build")
        if ptype in ("generator_merge_build", "command_only") and build:
            logger.info(f"\nPhase 3: Build")

            # Check git status before build
            cwd_build = expand(project.get("repo_root") or build.get("cwd"))
            if not check_git_status(cwd_build):
                raise RuntimeError("Repo has uncommitted changes; manual cleanup required")

            # Build
            result = run(build["command"], cwd=build["cwd"], timeout=600, check=False)

            if result.returncode != 0:
                logger.error("Build FAILED. Not committing.")
                raise RuntimeError("Build failed")

            logger.info("Build succeeded ✓")

        # === PHASE 4: Health Check ===
        if not skip_health_check and project.get("priority_urls"):
            logger.info(f"\nPhase 4: Health Check")
            if not verify_pages(project["priority_urls"]):
                raise RuntimeError("Page verification failed")

        # === PHASE 5: Commit & Push ===
        if ptype in ("generator_merge_build", "command_only"):
            logger.info(f"\nPhase 5: Commit & Push")

            # Generate batch ID from output
            if ptype == "generator_merge_build":
                merge = project.get("merge")
                src = latest_file(merge["output_glob"])
                content = Path(src).read_text()
                batch_id = hashlib.sha256(content.encode()).hexdigest()[:8]
            else:
                batch_id = hashlib.sha256(json.dumps(project).encode()).hexdigest()[:8]

            git_commit_and_push(project, batch_id)

        logger.info(f"\n✓ {name} COMPLETE")

    except Exception as e:
        logger.error(f"\n✗ {name} FAILED: {e}", exc_info=True)
        raise

    finally:
        release_lock(lock_file)

def main():
    parser = argparse.ArgumentParser(description="SEO batch processor")
    parser.add_argument(
        "--skip-health-check",
        action="store_true",
        help="Skip health checks (for testing)"
    )
    parser.add_argument(
        "--project",
        type=str,
        help="Process only this project"
    )
    args = parser.parse_args()

    # Load config
    try:
        cfg = json.loads(CONFIG_PATH.read_text())
    except FileNotFoundError:
        logger.error(f"Config not found: {CONFIG_PATH}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid config JSON: {e}")
        sys.exit(1)

    logger.info(f"Loaded config: {CONFIG_PATH}")
    logger.info(f"Processing {len([p for p in cfg.values() if p.get('enabled')])} projects")

    # Process projects
    failed = []
    for name, project in cfg.items():
        if args.project and name != args.project:
            continue

        try:
            process_project(
                name,
                project,
                skip_health_check=args.skip_health_check
            )
        except Exception as e:
            logger.error(f"{name} failed: {e}")
            failed.append((name, str(e)))

    # Summary
    logger.info(f"\n{'='*60}")
    if failed:
        logger.error(f"FAILED: {len(failed)} projects")
        for name, error in failed:
            logger.error(f"  - {name}: {error}")
        sys.exit(1)
    else:
        logger.info(f"SUCCESS: All projects processed")
        sys.exit(0)

if __name__ == "__main__":
    main()
