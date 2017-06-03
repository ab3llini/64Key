from .eventhook import EventHook
from enum import Enum


class LogLevel(Enum):
    """!
    Criticalness of the message
    """
    Info = 0
    Debug = 1
    Warning = 2
    Fatal = 3


class Logger:
    """!
    Prints log messages on stdout
    """

    ## Event fired when a new message has been printed on the console.
    #  It's useful to show the log messages on the web page
    new_message = EventHook()

    @staticmethod
    def log(msg, level):
        """!
        Prints a message on stdout.
        @param msg The message to be logged
        @param level The criticalness level of the message
        """
        Logger.new_message.fire(msg, level)
        print("{}: {}".format(level.name, msg))
