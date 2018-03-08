from .processexecutor import ProcessExecutor
from .logger import Logger, LogLevel


class AvahiPublisher:
    """!
    Publishes a service on the network.
    """

    def __init__(self):
        """!
        The constructor.
        """
        self._service_name = ""
        self._service_desc = ""
        self._service_type = ""
        self._port = 0
        self._process = ProcessExecutor()

    def set_port(self, port):
        """!
        Set the port to publish.
        @param port The port that has to be published
        """
        self._port = port

    def set_service_name(self, name):
        """!
        Set the service name to publish.
        @param name The service name
        """
        self._service_name = name

    def set_service_desc(self, desc):
        """!
        Set the service description to publish.
        @param desc The service description
        """
        self._service_desc = desc

    def set_service_type(self, t):
        """!
        Set the service type to publish.
        @param t The type of the service
        """
        self._service_type = t

    def publish(self):
        """!
        Start publishing the service. This method will launch the 
        avahi-publish process.
        """
        Logger.log("Publishing service \"{}\" on port {}".format(
            self._service_name,
            self._port
        ), LogLevel.Debug)
        self._process.execute(['avahi-publish',
                               '-s',
                               self._service_name,
                               self._service_type,
                               str(self._port),
                               self._service_desc
                               ])

    def stop_publishing(self):
        """Stop publishing the service, stopping the avahi-publish process."""
        self._process.stop()
