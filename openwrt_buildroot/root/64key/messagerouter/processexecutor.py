import asyncio
from .eventhook import EventHook


class ProcessExecutor:
    """!
    Manages the execution of an external process
    """

    def __init__(self):
        self._is_process_running = False
        self._task = None
        ## Event fired when the process outputs a new line of data on stdout
        self.on_newline = EventHook()
        ## Event fired when the process outputs a new line of data on stderr
        self.on_stderr_newline = EventHook()

    def is_running(self):
        """!
        Returns True if the process is runnig, False otherwise
        """
        return self._is_process_running

    def stop(self):
        """!
        Stops the process
        """
        if self._is_process_running is True:
            self._task.cancel()

    def execute(self, cmd):
        """!
        Executes the command spawning a new process.

        @param cmd The command to run
        """
        if not self._is_process_running:
            self._is_process_running = True
            self._task = asyncio.get_event_loop().create_task(
                self._stream_subprocess(
                    cmd,
                    self._stdout_evt,
                    self._stderr_evt,
                ))

    def _stdout_evt(self, line):
        self.on_newline.fire(line)

    def _stderr_evt(self, line):
        self.on_stderr_newline.fire(line)

    async def _read_stream(self, stream, cb):
        while True:
            line = await stream.readline()
            if line:
                cb(line)
            else:
                break

    async def _stream_subprocess(self, cmd, stdout_cb, stderr_cb):
        process = await asyncio.create_subprocess_exec(*cmd,
                                                       stdout=asyncio.subprocess.PIPE,
                                                       stderr=asyncio.subprocess.PIPE)

        await asyncio.wait([
            self._read_stream(process.stdout, stdout_cb),
            self._read_stream(process.stderr, stderr_cb)
        ])
        return await process.wait()
