from netutils import NetUtils

username = 'User'

services = {
    'chat': {
        'name': 'Chat',
        'options': {}
    },
    'ping': {
        'name': 'Ping',
        'options': {}
    }
}

mesh_interface = 'bat0'
mesh_port = 8082
local_interface = 'br-lan'
local_port = 8081
web_port = 8000
web_url_prefix = '/www'
service_type = '_64key._tcp'
service_name = '64key'
service_desc = '64Key server'
uid = NetUtils.interface_address(mesh_interface)
