import os


class NetUtils:
    @staticmethod
    def interfaces_list():
        """!
        Returns the list of interfaces in the system"""
        return os.listdir('/sys/class/net/')

    @staticmethod
    def interface_address(name):
        """!
        Returns the ipv4 address assigned to an interface

        @param name The name of the interface (e.g. eth0)
        """
        try:
            return os.popen('ip addr show {}'.format(name)).read().split("inet ")[1].split("/")[0]
        except IndexError:
            return None
