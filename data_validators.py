#!/usr/bin/env python3
"""
Data validation module for SEO batch outputs.
Validates generator/command outputs before merge or build.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class DataValidator:
    """Validate structured data against schemas."""

    @staticmethod
    def validate_json_file(
        path: str,
        schema: Dict[str, Any],
        required_fields: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Load and validate JSON file.

        Args:
            path: File path
            schema: Validation schema (optional)
            required_fields: List of required keys per item

        Returns:
            Validated data

        Raises:
            ValueError: On validation failure
        """
        try:
            data = json.loads(Path(path).read_text())
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {path}: {e}")

        if not isinstance(data, list):
            raise ValueError(f"Expected list, got {type(data).__name__}")

        if len(data) == 0:
            raise ValueError("Data is empty")

        # Validate items
        if required_fields:
            for idx, item in enumerate(data):
                for field in required_fields:
                    if field not in item:
                        raise ValueError(f"Item {idx} missing required field: '{field}'")
                    if item[field] is None or item[field] == "":
                        raise ValueError(f"Item {idx} has empty required field: '{field}'")

        logger.info(f"Validated {len(data)} items from {path}")
        return data

    @staticmethod
    def validate_before_after(
        before_file: str,
        after_file: str,
        min_change_pct: float = 0.0
    ) -> Dict[str, Any]:
        """
        Compare before/after state; detect silent data loss.

        Args:
            before_file: JSON file before changes
            after_file: JSON file after changes
            min_change_pct: Minimum change % allowed (e.g., 0.5 = at least 0.5% change)

        Returns:
            Diff stats

        Raises:
            ValueError: If data loss detected
        """
        try:
            before = json.loads(Path(before_file).read_text())
            after = json.loads(Path(after_file).read_text())
        except (FileNotFoundError, json.JSONDecodeError) as e:
            raise ValueError(f"Cannot compare: {e}")

        before_count = len(before) if isinstance(before, list) else len(before.get("items", []))
        after_count = len(after) if isinstance(after, list) else len(after.get("items", []))

        pct_change = abs((after_count - before_count) / max(before_count, 1)) * 100

        logger.info(f"Before: {before_count} items | After: {after_count} items | Change: {pct_change:.1f}%")

        if after_count < before_count:
            loss_pct = ((before_count - after_count) / before_count) * 100
            logger.warning(f"Data loss detected: {loss_pct:.1f}% ({before_count - after_count} items)")

            if loss_pct > 5:  # Flag if >5% loss
                raise ValueError(f"Excessive data loss: {loss_pct:.1f}%")

        return {
            "before": before_count,
            "after": after_count,
            "change_pct": pct_change,
            "items_added": max(0, after_count - before_count),
            "items_removed": max(0, before_count - after_count)
        }

    @staticmethod
    def validate_database_output(data: List[Dict[str, Any]]) -> None:
        """
        Validate data:forge output for MoviesLike.

        Args:
            data: List of movie records

        Raises:
            ValueError: On validation failure
        """
        required = ["id", "title", "slug"]

        for idx, item in enumerate(data):
            for field in required:
                if field not in item:
                    raise ValueError(f"Movie {idx} missing '{field}'")

            # Validate slug format (alphanumeric + hyphen)
            slug = item.get("slug", "")
            if not slug or not all(c.isalnum() or c == "-" for c in slug):
                raise ValueError(f"Movie {idx} has invalid slug: '{slug}'")

        logger.info(f"Validated {len(data)} movies")


class DumpManager:
    """Save/restore state for debugging and rollback."""

    @staticmethod
    def dump_before_merge(project_name: str, source: str, target: str) -> str:
        """
        Backup target file before merge.

        Returns:
            Backup path
        """
        backup_dir = Path("/tmp/seo_batch_backups") / project_name
        backup_dir.mkdir(parents=True, exist_ok=True)

        src_path = Path(source)
        tgt_path = Path(target).expanduser()

        backup_src = backup_dir / f"{src_path.stem}_input.json"
        backup_tgt = backup_dir / f"{tgt_path.stem}_before.json"

        if src_path.exists():
            backup_src.write_text(src_path.read_text())

        if tgt_path.exists():
            backup_tgt.write_text(tgt_path.read_text())
        else:
            logger.debug(f"Target doesn't exist yet: {tgt_path}")

        logger.info(f"Backed up to {backup_dir}")
        return str(backup_dir)

    @staticmethod
    def restore_from_backup(backup_dir: str, target_file: str) -> None:
        """Restore target from backup."""
        backup_path = Path(backup_dir) / f"{Path(target_file).stem}_before.json"

        if not backup_path.exists():
            logger.error(f"No backup found: {backup_path}")
            return

        Path(target_file).expanduser().write_text(backup_path.read_text())
        logger.info(f"Restored from {backup_path}")
