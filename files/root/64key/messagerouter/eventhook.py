
class EventHook(object):
    """!
    Generic event with a list of associated listeners.
    """
    def __init__(self):
        self.__listeners = []

    def __iadd__(self, listener):
        """!
        Add a function as a listener for the event.
        @param listener Function that will be called when the event is fired
        """
        self.__listeners.append(listener)
        return self

    def __isub__(self, listener):
        """!
        Remove a function previously added as a listener for the event.
        @param listener Function that must be removed from the list of 
        listeners for the event
        """
        self.__listeners.remove(listener)
        return self

    def fire(self, *args, **keywargs):
        """!
        Fire the event, calling all the function listeners in the list.
        @param *args The arguments that have to be passed to the listeners
        """
        for handler in self.__listeners:
            handler(*args, **keywargs)
