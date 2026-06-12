#!/usr/bin/env python3
"""
日志系统测试
"""

import logging
import sys
from pathlib import Path

import pytest

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent.parent
if str(_script_dir / "src") not in sys.path:
    sys.path.insert(0, str(_script_dir / "src"))


class TestLogger:
    """测试日志系统"""

    def test_get_logger(self):
        """测试获取 logger"""
        from youth_weekly.core.logger import get_logger

        logger = get_logger()
        assert isinstance(logger, logging.Logger)

    def test_get_named_logger(self):
        """测试获取具名 logger"""
        from youth_weekly.core.logger import get_logger

        logger = get_logger("test_module")
        assert isinstance(logger, logging.Logger)
        assert "test_module" in logger.name

    def test_setup_logger_default(self):
        """测试默认日志设置"""
        from youth_weekly.core.logger import setup_logger

        logger = setup_logger("test_default")
        assert logger.level == logging.INFO
        assert len(logger.handlers) > 0

    def test_setup_logger_with_file(self, tmp_path):
        """测试带文件的日志设置"""
        from youth_weekly.core.logger import setup_logger

        log_file = tmp_path / "test.log"
        logger = setup_logger("test_file", level=logging.DEBUG, log_file=log_file)

        logger.info("Test message")

        # 验证文件被创建
        assert log_file.exists()

    def test_setup_logger_custom_level(self):
        """测试自定义日志级别"""
        from youth_weekly.core.logger import setup_logger

        logger = setup_logger("test_level", level=logging.WARNING)
        assert logger.level == logging.WARNING

    def test_setup_logger_no_console(self, tmp_path):
        """测试无控制台输出"""
        from youth_weekly.core.logger import setup_logger

        log_file = tmp_path / "silent.log"
        logger = setup_logger(
            "test_silent",
            level=logging.INFO,
            log_file=log_file,
            console=False,
        )

        # 只有一个 handler (file)
        assert len(logger.handlers) == 1

    def test_convenience_functions(self):
        """测试便捷日志函数"""
        from youth_weekly.core import logger as logger_module

        # 这些函数不应该抛出异常
        logger_module.debug("debug message")
        logger_module.info("info message")
        logger_module.warning("warning message")
        logger_module.error("error message")

    def test_colored_formatter(self):
        """测试彩色格式化器"""
        import logging

        from youth_weekly.core.logger import ColoredFormatter

        formatter = ColoredFormatter("%(levelname)s - %(message)s")
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="test message",
            args=(),
            exc_info=None,
        )

        # 不在 TTY 环境中，应该不会添加颜色
        result = formatter.format(record)
        assert "INFO" in result
        assert "test message" in result


class TestDecorators:
    """测试装饰器"""

    def test_log_execution_time_success(self):
        """测试执行时间装饰器（成功情况）"""
        from youth_weekly.core.logger import log_execution_time

        @log_execution_time()
        def sample_func():
            return 42

        result = sample_func()
        assert result == 42

    def test_log_execution_time_failure(self):
        """测试执行时间装饰器（失败情况）"""
        from youth_weekly.core.logger import log_execution_time

        @log_execution_time()
        def failing_func():
            raise ValueError("test error")

        with pytest.raises(ValueError, match="test error"):
            failing_func()

    def test_log_exception_decorator(self):
        """测试异常装饰器"""
        from youth_weekly.core.logger import log_exception

        @log_exception()
        def error_func():
            raise RuntimeError("decorated error")

        with pytest.raises(RuntimeError, match="decorated error"):
            error_func()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
