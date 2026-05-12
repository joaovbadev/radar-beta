import logging
import sys


class SafeStreamHandler(logging.StreamHandler):
    """StreamHandler that replaces unencodable characters instead of crashing."""

    def emit(self, record):
        try:
            super().emit(record)
        except UnicodeEncodeError:
            # Fall back to ASCII-safe representation
            record.msg = record.msg.encode("ascii", "replace").decode("ascii")
            record.args = tuple(
                str(a).encode("ascii", "replace").decode("ascii")
                if isinstance(a, str) else a
                for a in (record.args or ())
            )
            super().emit(record)


def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(logging.DEBUG)

        # Use UTF-8 on stdout when possible
        try:
            stream = open(sys.stdout.fileno(), "w", encoding="utf-8", closefd=False)
            handler = logging.StreamHandler(stream)
        except Exception:
            handler = SafeStreamHandler(sys.stdout)

        handler.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
            datefmt="%H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False

    return logger
