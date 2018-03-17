from .processexecutor import ProcessExecutor
from enum import Enum
from .eventhook import EventHook
from .logger import Logger, LogLevel


class EventFieldsEnum(Enum):
    """!
    Defines the list of parameters that 'avahi-browse --parsable -r -a' outputs.
    """
    TYPE = 0
    INTERFACE = 1
    IP_VERSION = 2
    SERVICE_NAME = 3
    SERVICE_TYPE = 4
    SEARCH_DOMAIN = 5
    DOMAIN_NAME = 6
    ADDRESS = 7
    PORT = 8
    SERVICE_DESC = 9


class AvahiEvent:
    """!
    Event fired when a host becomes available or unavailable on the network.
    It does carry all the information on the host and the provided service:
    IP address, port, service name, and so on.
    """
    SERVICE_NEW = 0
    SERVICE_UPDATED = 1
    SERVICE_REMOVED = 2

    def __init__(self, line):
        """!
        Take a single line of the output of 'avahi-browse --parsable -r -a'
        command and parses it. Raises ValueError if there aren't all the needed 
        fields in the string.
        @param line A valid input string must have all the fields defined by 
        EventFieldsEnum separated by a semicolon.

        @param line A line of output from the Avahi process
        """
        Logger.log("avahi event: {}".format(line), LogLevel.Debug)
        param_list = line.split(';')
        if not len(line.split(';')) >= len(EventFieldsEnum):
            raise ValueError("Too few arguments")
        else:
            if param_list[EventFieldsEnum.TYPE.value] == '+':
                self._evt_type = AvahiEvent.SERVICE_NEW
            elif param_list[EventFieldsEnum.TYPE.value] == '=':
                self._evt_type = AvahiEvent.SERVICE_UPDATED
            elif param_list[EventFieldsEnum.TYPE.value] == '-':
                self._evt_type = AvahiEvent.SERVICE_REMOVED
            else:
                raise ValueError("Parse error: unexpected string {}"
                                 .format(param_list[EventFieldsEnum.TYPE.value]))
            self._interface = param_list[EventFieldsEnum.INTERFACE.value]
            self._ip_version = int(param_list[EventFieldsEnum.IP_VERSION.value].split("IPv")[1])
            self._service_name = param_list[EventFieldsEnum.SERVICE_NAME.value]
            self._service_type = param_list[EventFieldsEnum.SERVICE_TYPE.value]
            self._search_domain = param_list[EventFieldsEnum.SEARCH_DOMAIN.value]
            self._domain_name = param_list[EventFieldsEnum.DOMAIN_NAME.value]
            addr = param_list[EventFieldsEnum.ADDRESS.value]
            if self.ip_version == 6:
                self._address = '[' + addr + ']'
            else:
                self._address = addr
            self._port = int(param_list[EventFieldsEnum.PORT.value])
            self._service_desc = param_list[EventFieldsEnum.SERVICE_DESC.value]

    @property
    def evt_type(self):
        return self._evt_type

    @property
    def interface(self):
        return self._interface

    @property
    def ip_version(self):
        return self._ip_version

    @property
    def service_name(self):
        return self._service_name

    @property
    def service_type(self):
        return self._service_type

    @property
    def search_domain(self):
        return self._search_domain

    @property
    def domain_name(self):
        return self._domain_name

    @property
    def address(self):
        return self._address

    @property
    def port(self):
        return self._port

    @property
    def service_desc(self):
        return self._service_desc


class AvahiDiscovery:
    """!
    Fires an event when a hosts appears on the network or goes away.
    """
    def __init__(self):
        self._proc = ProcessExecutor()
        self._proc.on_newline += lambda line: \
            self._on_process_output(line)
        ## Event fired when there is a new event from Avahi
        self.on_discovery_event = EventHook()

    def start_browsing(self):
        """!
        Start the discovery on all interfaces. It does launch the avahi-browse
        command and listens for output. When an event occours,
        AvahiDiscovery::on_avahi_event gets triggered.
        """
        self._proc.execute(["avahi-browse", "-p", "-a", "-r"])

    def stop_browsing(self):
        """!
        Stop the discovery.
        """
        self._proc.stop()

    def _on_process_output(self, line):
        line = line.decode('utf-8').rstrip()
        try:
            evt = AvahiEvent(line)
            self.on_discovery_event.fire(evt)
        except ValueError:
            """!
            Half of the output lines of avahi-browse do not have the IP 
            address and other fields, so we must not log this, since it's 
            not an error.
            """
            pass
