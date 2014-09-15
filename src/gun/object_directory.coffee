module.exports = (gun) ->

    gun.Mixin 'object_directory', ->


        build_obj_id = (self, conf) ->

            if self.name
                if conf.objectDirectory.obj_directory[self.name]?
                    throw new Error "object name '#{self.name}' already exists for #{conf.objectTypeName}"
                return self.name

            conf.objectDirectory.cur_obj_id++
            "#{conf.objectTypeName}@#{conf.objectDirectory.cur_obj_id}"



        initialize: (o, conf) ->

            conf.objectDirectory or=
                obj_directory: {}
                latest_obj: null
                cur_obj_id: 0

            o.name = build_obj_id(o, conf)
            _conf = conf.objectDirectory
            _conf.obj_directory[o.name] = o

            finder = (name) -> _conf.obj_directory[name]

            unless _conf.static_finder_created
                _conf.static_finder_created = yes

                conf.gun.Namespace conf.objectTypeName, (exports) ->
                    exports.get = finder
                    exports.find = finder
                    exports.latest = -> _conf.latest_obj
                    return

            _conf.latest_obj = o


# vim: noexpandtab sts=4 sw=4 ts=4
