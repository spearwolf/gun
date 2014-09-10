module.exports = (papa) ->

    papa.Mixin 'object_directory', ->


        build_obj_id = (self, conf) ->

            if self.name
                if conf.objectDirectory.obj_directory[self.name]?
                    throw new Error "object name '#{self.name}' already exists for #{conf.objectTypeName}"
                return self.name

            conf.objectDirectory.cur_obj_id++
            "#{conf.objectTypeName}@#{conf.objectDirectory.cur_obj_id}"



        initialize: (obj) ->

            obj.conf.objectDirectory or=
                obj_directory: {}
                latest_obj: null
                cur_obj_id: 0

            obj.self.name = build_obj_id(obj.current, obj.conf)
            _conf = obj.conf.objectDirectory
            _conf.obj_directory[obj.self.name] = obj.self

            finder = (name) -> _conf.obj_directory[name]

            unless _conf.static_finder_created
                _conf.static_finder_created = yes

                obj.conf.app.Namespace obj.conf.objectTypeName, (exports) ->
                    exports.get = finder
                    exports.find = finder
                    exports.latest = -> _conf.latest_obj
                    return

            _conf.latest_obj = obj.self


# vim: noexpandtab sts=4 sw=4 ts=4
