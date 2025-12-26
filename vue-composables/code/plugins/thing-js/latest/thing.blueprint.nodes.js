(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
})((function () { 'use strict';

	class BaseNode3D extends THING.BLUEPRINT.BaseNode {
		static BASEURL = 'https://cdn.uino.cn/blueprint/'
		constructor() {
			super();
		}

		get app() {
			return THING.Utils.getCurrentApp();
		}

		setStyleProp(object, prop, value = null) {
			const _objCtr = object || new THING.Selector();

			if (_objCtr.isSelector) {
				const len = _objCtr.length;

				if (len > 0) {
					for (let idx = 0; idx < len; idx++) {
						if (_objCtr[idx].isPrefabObject) {
							_objCtr[idx].traverse(child => {
								child.style[prop] = value;
							});
						} else {
							_objCtr[idx].style[prop] = value;
						}
					}
				}
			}
			// if (object) {
			// 	object.forEach((obj) => {
			// 		// 如果是预制件，则需要递归子对象设置
			// 		if (obj.isPrefabObject) {
			// 			obj.traverse(child => {
			// 				child.style[prop] = value;
			// 			});
			// 		} else {
			// 			obj.style[prop] = value;
			// 		}
			// 	})
			// }
		}

		getDefaultTag() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
				/[xy]/g,
				function (c) {
					var r = (Math.random() * 16) | 0,
						v = c == 'x' ? r : (r & 0x3) | 0x8;
					return v.toString(16);
				}
			);
		}
		fixIrregularJSON(inputStr) {
			// 使用正则表达式匹配并修复不规则的 JSON 字符串
			const fixedStr = inputStr
				.replace(/'/g, '"')   // 将单引号替换为双引号
				.replace(/(\w+):/g, '"$1":')  // 修复未引用的属性名
				.replace(/True/g, 'true')     // 修复布尔值的表示
				.replace(/False/g, 'false');  // 修复布尔值的表示
			return fixedStr;
		}
		handleTime(time) {
			let reg = /^\d+(\.\d+)?$/;
			if (reg.test(time)) {
				return time * 1000;
			} else {
				return 0;
			}
		}

		/**
		 * @description 找到thing-js提供的div3d节点，然后尝试在其父级添加ui节点，如果失败，则在其同级添加节点
		 * @return { void }
		 */
		validNodeUserInterface() {
			let nodeUserInterface = document.getElementById('uino-container-ui');

			if (!nodeUserInterface) {
				nodeUserInterface = document.createElement('div');
				nodeUserInterface.setAttribute('id', 'uino-container-ui');
				nodeUserInterface.setAttribute('class', 'uino-container-ui');

				const style = nodeUserInterface.style;
				style.position = 'absolute';
				style.top = '50%';
				style.left = '50%';
				style.transform = 'translate(-50%, -50%)';
				style.width = '100%';
				style.height = '100%';
				style.background = 'transparent';
				style['pointer-events'] = 'none';

				const nodeParent = document.getElementById('div3d');

				if (nodeParent) {
					try {
						nodeParent.parentNode.style.position = 'relative';
						nodeParent.parentNode.appendChild(nodeUserInterface);
					} catch {
						nodeParent.style.position = 'relative';
						nodeParent.appendChild(nodeUserInterface);
					}
				}
			}
		}

		/**
		 * @description 通过判断ui父级节点是否存在子节点，如果不存在，则清理掉父级节点
		 * @return { void }
		 */
		recycleNodeUserInterface() {
			const nodeUserInterface = document.getElementById('uino-container-ui');

			if (nodeUserInterface) {
				if (nodeUserInterface.childNodes.length === 0) {
					nodeUserInterface.remove();
				}
			}
		}

		toSelector(objs) {
			const selector = new THING.Selector();
			selector.push(objs);
			return selector
		}
	}

	class BPPrint extends BaseNode3D {
	    static config = {
	        name: 'BPPrint',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'type',
	                type: 'select',
	                value: ['log', 'warn', 'error', 'debug'],
	                visiblePin: false
	            },
	            {
	                name: 'printOnScreen',
	                type: 'boolean',
	                value: true,
	                visiblePin: false
	            },

	            {
	                name: 'value',
	                type: 'any',
	                input: true
	            },

	            {
	                name: 'printObject',
	                type: 'boolean',
	                value: false,
	                advanced: true
	            }

	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            }
	        ]
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        var value = inputs['value'];
	        let printObject = inputs['printObject'];
	        if (value === undefined) {
	            return;
	        }

	        if (!value.isSelector) {
	            switch (Object.prototype.toString.call(value)) {
	                case '[object Object]':
	                    if (!printObject) {
	                        value = value.name || value.id || value.type;
	                    }
	                    break
	            }
	        }

	        if (value.isSelector && value.length > 0 && !printObject) {
	            value = value[0].name || value[0].id || value[0].type;
	        }

	        var type = inputs['type'];
	        if (!type) {
	            return;
	        }

	        let flag = inputs['printOnScreen'];
	        if (flag) {
	            // 如果要在屏幕上打印
	            var div3d = document.getElementById("div3d");
	            if (!document.getElementById("scrollDisplay")) {
	                var divAll = document.createElement("div");
	                divAll.id = "scrollDisplay";
	                divAll.style.right = '10px';
	                divAll.style.position = 'absolute';
	                div3d.insertBefore(divAll, div3d.childNodes[0]);
	            }
	            var scrollDisplay = document.getElementById("scrollDisplay");
	            divAll = scrollDisplay;
	            var divCont = document.createElement("div");
	            divAll.insertBefore(divCont, divAll.children[0]);
	            divCont.innerText = value;
	            divCont.style.color = "#fff";
	            divCont.style.position = "relative";
	            divCont.style.zIndex = "1";
	            if (divCont.innerText) {
	                setTimeout(() => {
	                    var childLength = divAll.childNodes.length;
	                    divAll.removeChild(divAll.childNodes[childLength - 1]);
	                }, 3000);
	            }
	            switch (type) {
	                case 'debug':
	                    // 桃红色 #f11caf
	                    divCont.style.color = "#f11caf";
	                    break;
	                case 'log':
	                    // 白色 #fff
	                    divCont.style.color = "#fff";
	                    break;
	                case 'warn':
	                    // 黄色 #f1c31c
	                    divCont.style.color = "#f1c31c";
	                    break;
	                case 'error':
	                    // 红色 #ff0000
	                    divCont.style.color = "#ff0000";
	                    break;
	            }
	        }

	        switch (type) {
	            case 'debug':
	                console.debug(value); break;
	            case 'log':
	                console.log(value); break;
	            case 'warn':
	                console.warn(value); break;
	            case 'error':
	                console.error(value); break;
	        }
	    }
	}

	class BPRegisterBlueprintNode extends BaseNode3D {
	  static config = {
	    name: 'BPRegisterBlueprintNode',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'url',
	        type: 'string'
	      },
	      // {
	      //   name: 'name',
	      //   type: 'string'
	      // }
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let nodeurl = inputs['url'];

	    THING.Utils.importScript(nodeurl).then((result) => {
	      let nodeClass;
	      if (result.default && result.default[0]) {
	        nodeClass = result.default[0];
	      }

	      blueprint.registerNode(nodeClass);
	      let contextMenuData = JSON.parse(JSON.stringify(editor.contextMenuData));
	      contextMenuData.children.forEach((item) => {
	        if (item.foldername === 'prefab' && item.nodes.indexOf(nodeClass.config.name) === -1) {
	          item.nodes.push(nodeClass.config.name);
	        }
	      });
	      editor.loadFolder(contextMenuData);
	    });

	    let prefabList = localStorage.getItem('prefab-list');
	    if (!prefabList) {
	      prefabList = [];
	    } else {
	      prefabList = JSON.parse(prefabList);
	    }
	    prefabList.push(nodeurl);
	    localStorage.setItem('prefab-list', JSON.stringify(prefabList));

	  }
	  onStop() {

	  }
	}

	class BPLoad extends BaseNode3D {
	    static config = {
	        name: 'BPLoad',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'url',
	                type: 'string',
	                value: `${BaseNode3D.BASEURL}scene/factory/`
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.selector = new THING.Selector();
	    }

	    onExecute(data, inputs, outputs) {
	        let url = inputs.url;
	        let app = this.app;

	        if (url) {
	            const ext = url._getExtension();
	            if (ext === 'json' || ext === 'tsf') {
	                app.load(url);
	            }
	            else if (THING.Utils.isModelSceneExtension(ext)) {
	                let promise = app.load(url);
	                promise.then((object) => {
	                    this._root = object.root;
	                    this.selector.push(object.root);
	                    this.run('complete', {
	                        object: this.toSelector(this._root)
	                    });
	                });
	            }
	            else {
	                let bundle = app.loadBundle(url);
	                bundle.waitForComplete().then(() => {
	                    this._root = bundle.campuses[0];
	                    this.selector.push(bundle.campuses[0]);
	                    this.run('complete', {
	                        object: this.toSelector(this._root)
	                    });
	                });
	            }
	        }

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        let app = this.app;
	        if (!this._root && app.query('.Campus')[0]) {
	            app.query('.Campus')[0].destroy();
	        }
	        if (app.root.hasComponent('renderSetting')) {
	            app.root.removeComponent("renderSetting");
	        }
	        this.selector.destroy();
	        this.selector.clear();
	    }
	}

	class BPLoadTheme extends BaseNode3D {
	    static config = {
	        name: 'BPLoadTheme',
	        group: 'Custom',
	        inputs: [{
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'url',
	                type: 'string',
	                value: 'https://www.thingjs.org.cn/cdn/blueprint/resource/testload/theme/resource.json'
	            },
	            {
	                name: 'apply',
	                type: 'boolean',
	                value: true
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ],
	        outputs: [{
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.renderSettings = this.app.renderSettings;
	        this.selector = new THING.Selector();
	    }

	    onExecute(data, inputs, outputs) {
	        let url = inputs.url;
	        let _apply = inputs.apply;
	        this.object = inputs.object;
	        let app = this.app;

	        outputs["object"] = this.object;

	        if (url) {
	            let param = {
	                apply: _apply
	            };
	            if (this.object && this.object.length > 0) {
	                param.object = this.object[0];
	            }
	            app.load(url, param).then((ev) => {
	                this.bundle = ev;
	                this.run('complete', {
	                    object: this.object
	                });
	            });
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this.app.renderSettings = this.renderSettings;
	        this.bundle.effectGroundObjects?.forEach(effectGround => {
	            effectGround.destroy();
	        });
	        if (this.object && this.object.length > 0) {
	            if (!this.object[0].destroyed) {
	                this.app.themeManager.clearStyles(this.object[0]);
	            }
	        } else if (this.app.query('.Campus')[0]) {
	            this.app.themeManager.clearStyles(this.app.query('.Campus')[0]);
	        }
	    }
	}

	class BPExpandFloors extends BaseNode3D {
	  static config = {
	    name: 'BPExpandFloors',
	    group: 'Basic',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'building',
	        type: 'selector'
	      },
	      {
	        name: 'expand',
	        type: 'boolean',
	        value: true
	      }
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec'
	      },
	    ],
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    this.app;
	    let building = inputs['building'];
	    if (!building || building.length == 0) {
	      return;
	    }
	    building = building[0];
	    if (!building.tags.has('Building')) return
	    let _expand = inputs['expand'] || false;
	    if (_expand) {
	      building.expandFloors();
	    } else {
	      building.unexpandFloors();
	    }
	  }
	}

	class BPChangeLevel extends BaseNode3D {
	    static config = {
	        name: 'BPChangeLevel',
	        group: 'Custom',
	        inputs: [{
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'levelObject',
	                type: 'selector',
	            },
	        ],
	        outputs: [{
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.campus = null;
	    }
	    async onExecute(data, inputs, outputs) {
	        let _object = inputs['levelObject'];
	        if (!_object || _object.length == 0) {
	            return;
	        }

	        outputs["object"] = _object;

	        this.app.level.change(_object[0], {
	            complete: (ev) => {
	                this.run('complete', {
	                    object: this.toSelector(ev.current)
	                });
	            },
	            stop: () => {

	            }
	        });
	    }
	}

	class BPGetCurrentLevel extends BaseNode3D {
	    static config = {
	        name: 'BPGetCurrentLevel',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.campus = null;
	    }
	    async onExecute(data, inputs, outputs) {
	        outputs['object'] = this.app.level.current;
	    }
	}

	class BPGetPrevLevel extends BaseNode3D {
	    static config = {
	        name: 'BPGetPrevLevel',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.campus = null;
	    }
	    async onExecute(data, inputs, outputs) {
	        outputs['object'] = this.app.level.prev;
	    }
	}

	class BPLevelBack extends BaseNode3D {
	    static config = {
	        name: 'BPLevelBack',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.campus = null;
	    }
	    async onExecute(data, inputs, outputs) {
	        let app = this.app;
	        if (app.level.current) {
	            app.level.back();
	        }

	    }
	}

	class BPEnterCampusLevelEvent extends BaseNode3D {
		static config = {
			name: 'BPEnterCampusLevelEvent',
			outputs: [
				{
					name: 'enter',
					type: 'callback',
				},
				{
					name: 'quit',
					type: 'callback',
				},
				{
					name: 'campus',
					type: 'selector'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let that = this;

			let type = 'Campus';

			let app = this.app;

			let _enterCampus = new THING.Selector();
			let _leaveCampus = new THING.Selector();
			app.on(THING.EventType.AfterEnterLevel, (ev) => {

				if (type == ev.current.type) {
					_enterCampus.clear();
					_enterCampus.push(ev.current);
					that.run('enter', { campus: _enterCampus });
				}

			}, 'EnterCampusLevel_BP');


			app.on(THING.EventType.AfterLeaveLevel, (ev) => {

				if (type == ev.current.type) {
					_leaveCampus.clear();
					_leaveCampus.push(ev.current);
					that.run('quit', { campus: _leaveCampus });
				}

			}, 'LeaveCampusLevel_BP');

		}


	}

	class BPEnterBuildingLevelEvent extends BaseNode3D {
		static config = {
			name: 'BPEnterBuildingLevelEvent',
			outputs: [
				{
					name: 'enter',
					type: 'callback',
				},
				{
					name: 'quit',
					type: 'callback',
				},
				{
					name: 'building',
					type: 'selector'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let that = this;

			let type = 'Building';

			let app = this.app;

			let _enterBuilding = new THING.Selector();
			let _leaveBuilding = new THING.Selector();

			app.on(THING.EventType.AfterEnterLevel, (ev) => {

				if (type == ev.current.type) {
					_enterBuilding.clear();
					_enterBuilding.push(ev.current);
					that.run('enter', { building: _enterBuilding });
				}

			}, 'EnterBuildingLevel_BP');


			app.on(THING.EventType.AfterLeaveLevel, (ev) => {

				if (type == ev.current.type) {
					_leaveBuilding.clear();
					_leaveBuilding.push(ev.current);
					that.run('quit', { building: _leaveBuilding });
				}

			}, 'LeaveBuildingLevel_BP');

		}


	}

	class BPEnterFloorLevelEvent extends BaseNode3D {
		static config = {
			name: 'BPEnterFloorLevelEvent',
			outputs: [
				{
					name: 'enter',
					type: 'callback',
				},
				{
					name: 'quit',
					type: 'callback',
				},
				{
					name: 'floor',
					type: 'selector'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let that = this;

			let type = 'Floor';

			let app = this.app;

			let _enterFloor = new THING.Selector();
			let _leaveFloor = new THING.Selector();
			app.on(THING.EventType.AfterEnterLevel, (ev) => {

				if (type == ev.current.type) {
					_enterFloor.clear();
					_enterFloor.push(ev.current);
					that.run('enter', { floor: _enterFloor });
				}

			}, 'EnterFloorLevel_BP');


			app.on(THING.EventType.AfterLeaveLevel, (ev) => {

				if (type == ev.current.type) {
					_leaveFloor.clear();
					_leaveFloor.push(ev.current);
					that.run('quit', { floor: _leaveFloor });
				}

			}, 'LeaveFloorLevel_BP');

		}


	}

	class BPEnterRoomLevelEvent extends BaseNode3D {
		static config = {
			name: 'BPEnterRoomLevelEvent',
			outputs: [
				{
					name: 'enter',
					type: 'callback',
				},
				{
					name: 'quit',
					type: 'callback',
				},
				{
					name: 'room',
					type: 'selector'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let that = this;

			let type = 'Room';

			let app = this.app;

			let _enterRoom = new THING.Selector();
			let _leaveRoom = new THING.Selector();
			app.on(THING.EventType.AfterEnterLevel, (ev) => {

				if (type == ev.current.type) {
					_enterRoom.clear();
					_enterRoom.push(ev.current);
					that.run('enter', { room: _enterRoom });
				}

			}, 'EnterRoomLevel_BP');


			app.on(THING.EventType.AfterLeaveLevel, (ev) => {

				if (type == ev.current.type) {
					_leaveRoom.clear();
					_leaveRoom.push(ev.current);
					that.run('quit', { room: _leaveRoom });
				}

			}, 'LeaveRoomLevel_BP');

		}


	}

	class BPCreateLevelTreeUI extends BaseNode3D {
	  static config = {
	    name: 'BPCreateLevelTreeUI',
	    inputs: [{
	      name: 'exec',
	      type: 'exec',
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    },
	    ],
	    outputs: [{
	      name: 'exec',
	      type: 'exec',
	    },
	    {
	      name: 'callback',
	      type: 'callback',
	    },
	    {
	      name: 'clickObj',
	      type: 'selector'
	    }
	    ]
	  }

	  constructor() {
	    super();
	    this._objects = new THING.Selector();
	  }
	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    const campuses = inputs['object'] || new THING.Selector();
	    let rootDom = document.getElementById('levelDom');
	    let oDiv3dBox = document.querySelector("#div3d").parentNode;
	    if (rootDom) {
	      oLayerButtonRoot.remove();
	    }
	    let levelDom = '<div class="levelDom">';
	    let num = 0;
	    let that = this;
	    /**
	     * 根节点信息
	     * @param {Object} root - root类
	     */
	    function getRootData(root) {
	      var data = [];
	      data.push(getSceneRoot(root));
	      return data;
	    }
	    /**
	     * 根节点信息
	     * @param {Object} root - root类
	     */
	    function getSceneRoot(root) {
	      var data = {
	        id: root.id,
	        checked: true,
	        state: 'open',
	        text: 'root',
	      };
	      data["children"] = [];
	      campuses.forEach(function (campus) {
	        data["children"].push(getCampusData(campus));
	      });
	      return data;
	    }
	    /**
	     * 根节点信息由建筑和室外物体组成
	     * @param {Object} campus - 园区类
	     */
	    function getCampusData(campus) {
	      var data = {
	        id: campus.id,
	        checked: true,
	        state: 'open',
	        text: campus.type + ' (' + campus.id + ')'
	      };
	      data["children"] = [];
	      campus.buildings.forEach(function (building) {
	        data["children"].push(getBuildingData(building));
	      });
	      var arr1 = campus.queryByTags('Placement');
	      var arr = arr1.query(/a/);
	      arr.forEach(function (thing) {
	        data["children"].push(getThingData(thing));
	      });
	      return data;
	    }
	    /**
	     * 收集建筑信息
	     * @param {Object} building - 建筑对象
	     */
	    function getBuildingData(building) {
	      var data = {
	        id: building.id,
	        checked: true,
	        state: 'open',
	        text: building.type + ' (' + building.id + ')'
	      };
	      data["children"] = [];
	      building.floors.forEach(function (floor) {
	        data["children"].push(getFloorData(floor));
	      });
	      return data;
	    }
	    /**
	     * 收集楼层信息
	     * @param {Object} floor - 楼层对象
	     */
	    function getFloorData(floor) {
	      var data = {
	        id: floor.id,
	        checked: true,
	        state: 'open',
	        text: floor.type + ' (level:' + floor.levelNumber + ')'
	      };
	      data["children"] = [];
	      var sel = floor.queryByTags('Placement');
	      sel.query(/binet/).forEach(function (thing) {
	        data["children"].push(getThingData(thing));
	      });
	      return data;
	    }
	    /**
	     * 建筑对象
	     * @param {Object} thing - 物对象
	     */
	    function getThingData(thing) {
	      return {
	        id: thing.id,
	        checked: true,
	        text: thing.type + ' (' + thing.name + ')'
	      };
	    }
	    /**
	     * 层级列表节点添加样式
	     */
	    function addStyle() {
	      let domStyle = `<style class="levelDom"> 
      .levelDom {
        position:absolute;
        top:0px;
        right:0px;
        background-color:#fff;
        overflow-y: scroll;
        overflow-x: hidden;
        max-width:250px;
        padding:10px;
        max-height:480px;
      }
      .levelDom ul:first-child {
        padding-inline-start: 0px;
        padding-left:0px !important;
      }
      .levelDom ul {
        padding-inline-start: 0px;
      }
      .levelDom ul li {
        list-style: none;
      }
      .levelDom ul li span {
        display:inline-block;
        width:250px;
      }
      .levelDom ul li span:hover {
        background-color:#EAF2FF;
        cursor: pointer;
      }

    </style>`;
	      let oStyle = createDocument(domStyle, 'levelDom');
	      oDiv3dBox.appendChild(oStyle);
	    }
	    /**
	     * 创建DomParser
	     * @param {*} template html样式/标签
	     * @param {*} className 类名
	     * @returns 
	     */
	    function createDocument(template, className) {
	      let doc = new DOMParser().parseFromString(template, 'text/html');
	      let domObject = doc.querySelector(`.${className}`);
	      return domObject;
	    }
	    /**
	     * 调用生成列表
	     * @param {Object} obj rootData
	     * @param {Boolean} bool 是否展开列表
	     */
	    function genList(obj, bool) {
	      addList(obj, bool);
	      levelDom += '</div>';
	      that.rootDom = createDocument(levelDom, 'levelDom');
	      //页面标签创建完成
	      oDiv3dBox.appendChild(that.rootDom);
	      showList();
	    }
	    /**
	     * 生成html标签
	     * @param {Object} navInf rootData
	     * @param {*} dis 是否展开列表
	     */
	    function addList(navInf, dis) {
	      levelDom += `<ul style = "display: ${dis ? 'block' : ''};padding-left: 0px;background-color: #fff;">`;
	      for (let i = 0; i < navInf.length; i++) {
	        if (navInf[i].children && navInf[i].children.length) {
	          levelDom += `<li><span class="objName" id="${navInf[i].id}" style = "padding-left:${num * 20}px;"><i class="itemIcon iconfont ${dis ? "icon-xiajiantou" : "icon-youjiantou"}"></i>${navInf[i].text}</span>`;
	          num++;
	          addList(navInf[i].children, dis ? true : false);
	          num--;
	          levelDom += '</li>';
	        } else {
	          levelDom += `<li><span id="${navInf[i].id}" class="objName" style = "padding-left:${num * 20}px;">${navInf[i].text}</span></li>`;
	        }
	      }
	      levelDom += '</ul>';
	    }
	    /**
	     * dom节点添加点击事件
	     */
	    function showList() {
	      let objName = document.getElementsByClassName('objName');
	      let itemIcon = document.getElementsByClassName('itemIcon');
	      for (let i = 0; i < objName.length; i++) {
	        objName[i].addEventListener('click', (e) => {
	          for (let j = 0; j < objName.length; j++) {
	            objName[j].style.backgroundColor = '';
	          }
	          e.target.style.backgroundColor = '#FFE48D';
	          let obj = that.app.query('#' + e.target.id)[0];
	          if (obj) {
	            that._objects.push(obj);
	            outputs['clickObj'] = that._objects;
	            that.run('callback', outputs);
	            that._objects.clear();
	          }
	        });
	      }
	      for (let j = 0; j < itemIcon.length; j++) {
	        itemIcon[j].addEventListener('click', (e) => {
	          e.stopPropagation();
	          if (e.target.parentNode.nextElementSibling) {
	            const display = window.getComputedStyle(e.target.parentNode.nextElementSibling, null).getPropertyValue("display");
	            if (display == 'none') {
	              e.target.parentNode.nextElementSibling.style.display = 'block';
	              e.target.className = 'itemIcon iconfont icon-xiajiantou';
	            } else {
	              e.target.parentNode.nextElementSibling.style.display = 'none';
	              e.target.className = 'itemIcon iconfont icon-youjiantou';
	            }
	          }
	        }, false);
	      }
	    }
	    let rootData = getRootData(this.app.root);
	    addStyle();
	    genList(rootData, true);
	  }

	  // 当蓝图停止时被调用
	  onStop() {
	    const len = this._objects.length;
	    if (len && len > 0) {
	      this._objects.destroy();
	      this._objects.clear();
	    }
	    if (this.rootDom) {
	      this.rootDom.remove();
	    }
	  }
	}

	class BPCreateEntity extends BaseNode3D {
	    static config = {
	        name: 'BPCreateEntity',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'entity',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'entity'
	            },
	            {
	                name: 'url',
	                type: 'string',
	                value: 'https://model.3dmomoda.com/models/7bfb3321557a40fead822d7285ac5324/0/gltf'
	            },
	            {
	                name: 'localPosition',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'batchRender',
	                type: 'boolean',
	                value: false,
	                advanced: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let {
	            localPosition = [0, 0, 0],
	            rotation = [0, 0, 0],
	            scale = [1, 1, 1],
	            id = 'entity',
	            name = 'entity',
	            url = 'https://model.3dmomoda.com/models/7bfb3321557a40fead822d7285ac5324/0/gltf',
	            batchRender = false,
	        } = inputs;
	        let _object = new THING.Entity({
	            id,
	            name,
	            url,
	            localPosition,
	            rotation,
	            scale,
	            onComplete: (ev) => {
	                this._objects.push(ev.object);
	                outputs['object'] = this.toSelector(ev.object);
	                if (outputs['object'].length) {
	                    this.run('complete', outputs);
	                }
	            },
	        });
	        outputs['object'] = _object;
	        if (batchRender) {
	            _object.makeInstancedDrawing();
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this._objects.destroy();
	        this._objects.clear();
	    }
	}

	// let customComponents = []
	// outputs['object'][0].traverseComponentByType(THING.Component, (val, name) => {
	//     console.log(name)
	//     val.name = name // 加上名字，val 没有name
	//     console.log(val)
	//     customComponents.push(val)
	// })
	// customComponents.forEach((comp) => {
	//     const props = JSON.parse(JSON.stringify(comp.props || {}))
	//     console.log(props)
	//     for (let k in props) {
	//         const v = props[k]
	//         if (v.type === 'action') {
	//             Reflect.deleteProperty(props, k) // 删除掉 action
	//         }
	//     }
	//     if (Object.keys(props).length) {
	//         data[comp.name] = props
	//     }
	// })

	// console.log(data)

	class BPBatchCreateEntity extends BaseNode3D {
	    static config = {
	        name: 'BPBatchCreateEntity',
	        desc: 'THING.Entity',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'entity'
	            },
	            {
	                name: 'url',
	                type: 'any',
	                value: 'https://model.3dmomoda.com/models/98DEB861DA714DFC8776D4B937F368F7/0/gltf/',
	                input: true
	            },
	            {
	                name: 'points',
	                type: 'array',
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'result',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();

	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let url = inputs['url'];
	        let points = inputs['points'];
	        let name = inputs['name'] || 'entity';

	        let that = this;
	        let outputSelector = new THING.Selector();
	        for (let i = 0; i < points.length; i++) {
	            let _object = new THING.Entity({
	                name,
	                url: typeof url === 'string' ? url : THING.Math.randomFromArray(url),
	                position: points[i],
	                complete: async (ev) => {
	                    that._objects.push(ev.object);
	                    outputSelector.push(ev.object);
	                    if (i === points.length - 1) {
	                        that.run('complete', { result: outputSelector });
	                    }
	                },
	            });

	            _object.makeInstancedDrawing();
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this._objects.destroy();
	        this._objects.clear();
	    }

	}

	class BPQueryObject extends BaseNode3D {
	  static config = {
	    name: 'BPQueryObject',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'name',
	        type: 'string',
	      },
	      {
	        name: 'id',
	        type: 'string',
	        advanced: true
	      },
	      {
	        name: 'tag',
	        type: 'string'
	      },
	      {
	        name: 'type',
	        type: 'string',
	        advanced: true
	      },
	      {
	        name: 'attribute',
	        type: 'string',
	        advanced: true
	      },
	      {
	        name: 'customAttribute',
	        type: 'string',
	        advanced: true
	      },
	      {
	        name: 'object',
	        type: 'selector',
	        advanced: true,
	      },
	      {
	        name: 'containsChild',
	        type: 'boolean',
	        value: true,
	        advanced: true
	      },
	      {
	        name: 'fuzzyQuery',
	        type: 'boolean',
	        value: false,
	        advanced: true
	      },
	      {
	        name: 'chainQuery',
	        type: 'boolean',
	        value: false,
	      },
	      {
	        name: 'dynamic',
	        type: 'boolean',
	        value: false,
	        advanced: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'onAdd',
	        type: 'callback',
	        advanced: true
	      },
	      {
	        name: 'onRemove',
	        type: 'callback',
	        advanced: true
	      },
	      {
	        name: 'object',
	        type: 'selector',
	        advanced: true
	      },
	      {
	        name: 'allResult',
	        type: 'selector',
	      },
	    ]
	  }
	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {

	    let _name = inputs['name'];
	    let _tag = inputs['tag'];
	    let _id = inputs['id'];
	    let _type = inputs['type'];
	    let _attribute = inputs['attribute'];
	    let _customAttribute = inputs['customAttribute'];
	    let _object = inputs['object'];
	    let _containsChild = inputs['containsChild'];
	    let _fuzzyQuery = inputs['fuzzyQuery'];
	    let _chainQuery = inputs['chainQuery'];
	    let _dynamic = inputs['dynamic'];
	    if (_object && _object.length > 0) {
	      this.parent = _object[0];
	    } else {
	      this.parent = this.app;
	    }

	    let condition;
	    if (_chainQuery) {
	      _tag && (condition ? condition += `&&tags(${_tag})` : condition = `tags(${_tag})`);
	      _id && (condition ? condition += `&&#${_id}` : condition = `#${_id}`);
	      _type && (condition ? condition += `&&.${_type}` : condition = `.${_type}`);
	      _attribute && (condition ? condition += `&&[${_attribute}]` : condition = `[${_attribute}]`);
	      _customAttribute && (condition ? condition += `&&[userData/${_customAttribute}]` : condition = `[userData/${_customAttribute}]`);
	    } else {
	      _tag && (condition ? condition += `||tags(${_tag})` : condition = `tags(${_tag})`);
	      _id && (condition ? condition += `||#${_id}` : condition = `#${_id}`);
	      _type && (condition ? condition += `||.${_type}` : condition = `.${_type}`);
	      _attribute && (condition ? condition += `||[${_attribute}]` : condition = `[${_attribute}]`);
	      _customAttribute && (condition ? condition += `&&[userData/${_customAttribute}]` : condition = `[userData/${_customAttribute}]`);
	    }
	    if (_fuzzyQuery && _name) {
	      let reg = new RegExp(_name);
	      let expression = condition ? THING.Selector.buildExpression(condition) : null;
	      condition = (object) => {
	        if (_chainQuery) {
	          if (expression && !THING.Selector.testByExpression(expression, object)) {
	            return false;
	          }
	          if (!reg.test(object.name)) {
	            return false;
	          }
	          return true
	        } else {
	          if (expression && THING.Selector.testByExpression(expression, object)) {
	            return true;
	          }
	          if (reg.test(object.name)) {
	            return true;
	          }
	          return false;
	        }
	      };
	    } else {
	      if (_chainQuery) {
	        _name && (condition ? condition += `&&${_name}` : condition = `${_name}`);
	      } else {
	        _name && (condition ? condition += `||${_name}` : condition = `${_name}`);
	      }
	    }

	    if (!condition) {
	      return;
	    }

	    this.selector = this.parent.query(condition, {
	      recursive: _containsChild,
	      dynamic: _dynamic,
	      onAdd: (object) => {
	        outputs['object'] = this.toSelector(object);
	        this.run('onAdd', outputs);
	      },
	      onRemove: (object) => {
	        outputs['object'] = this.toSelector(object);
	        this.run('onRemove', outputs);
	      }
	    });

	    outputs['allResult'] = this.selector;
	    // let _tagResult;
	    // let _otherResult;
	    // let _regResult;

	    // function unique(arr) {
	    //     let arrSet = new Set(arr)
	    //     return Array.from(arrSet)
	    // }
	    // let expression = ''
	    // //按名称
	    // if (_name && _fuzzyQuery) {
	    //     let reg = new RegExp(_name)
	    //     _regResult = _parent.query(reg, { recursive: _containsChild });
	    // } else if (_name) {
	    //     expression = _name
	    // }
	    // //按照id
	    // if (_id) {
	    //         if (_chainQuery) {
	    //                 expression ? expression += `&&#${_id}` : expression = `#${_id}`
	    //         } else {
	    //                 expression ? expression += `||#${_id}` : expression = `#${_id}`
	    //         }
	    // }
	    // //按标签
	    // if (_tag && _tag !== 'choose') {
	    //         if (_chainQuery) {
	    //                 _parent = _regResult || _parent
	    //         }
	    //     _tagResult = _parent.query(function (object) {
	    //         return object.tags.has(_tag);
	    //     });
	    // }
	    // //按属性
	    // if (_attribute) {
	    //     _attribute = _attribute.replace(/\s*/g, "");
	    //     //按类型
	    //     if (_attribute && _attribute.indexOf('type=') === 0) {
	    //         let _type = _attribute.split('type=')[1];
	    //         if (_chainQuery) {
	    //                 expression ? expression += `&&.${_type}` : expression = `.${_type}`
	    //         } else {
	    //                 expression ? expression += `||.${_type}` : expression = `.${_type}`
	    //         }
	    //     } else if (_attribute) {
	    //         if (_chainQuery) {
	    //                 expression ? expression += `&&[${_attribute}]` : expression = `[${_attribute}]`
	    //         } else {
	    //                 expression ? expression += `||[${_attribute}]` : expression = `[${_attribute}]`
	    //         }
	    //     }
	    // }

	    // if (expression) {
	    //         if (_chainQuery) {
	    //                 _parent = _tagResult || _regResult || _parent;
	    //                 _otherResult = _parent.query(expression);
	    //         } else {
	    //                 _otherResult = _parent.query(expression, { recursive: _containsChild });
	    //         }
	    // }
	    // let _result = new THING.Selector();
	    // let objects = [];
	    // if (_chainQuery) {
	    //         let result = _otherResult || _tagResult || _regResult;
	    //        objects = result ? result.objects : [];
	    // } else {
	    //         if (_regResult && _regResult.length ) {
	    //                 objects = objects.concat(_regResult.objects)
	    //         }
	    //         if (_tagResult && _tagResult.length ) {
	    //                 objects = objects.concat(_tagResult.objects)
	    //         }
	    //         if (_otherResult && _otherResult.length) {
	    //                 objects = objects.concat(_otherResult.objects)
	    //         }
	    // }

	    // _result.push(unique(objects));
	    // outputs['allResult'] = _result
	  }

	  // 当蓝图停止时被调用

	  onStop() {
	    if (this.parent == this.app && this.selector) {
	      this.selector.clear();
	    }
	  }

	}

	class BPObjectSet extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSet',
	    inputs: [{
	      name: 'name',
	      type: 'string',
	    },
	    {
	      name: 'id',
	      type: 'string',
	      advanced: true
	    },
	    {
	      name: 'tag',
	      type: 'string'
	    },
	    {
	      name: 'attribute',
	      type: 'string',
	      advanced: true
	    },
	    {
	      name: 'object',
	      type: 'selector',
	      advanced: true,
	    },
	    {
	      name: 'containsChild',
	      type: 'boolean',
	      value: true,
	      advanced: true
	    },
	    {
	      name: 'fuzzyQuery',
	      type: 'boolean',
	      value: false,
	      advanced: true
	    },
	    {
	      name: 'chainQuery',
	      type: 'boolean',
	      value: false,
	    }
	    ],
	    outputs: [{
	      name: 'allResult',
	      type: 'selector',
	    }]
	  }
	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {

	    let _name = inputs['name'];
	    let _tag = inputs['tag'];
	    let _id = inputs['id'];
	    let _attribute = inputs['attribute'];
	    let _object = inputs['object'];
	    let _containsChild = inputs['containsChild'];
	    let _fuzzyQuery = inputs['fuzzyQuery'];
	    let _chainQuery = inputs['chainQuery'];
	    if (_object && _object.length > 0) {
	      _object = _object[0];
	    }
	    let _parent = _object || this.app;


	    let _tagResult;
	    let _otherResult;
	    let _regResult;

	    function unique(arr) {
	      let arrSet = new Set(arr);
	      return Array.from(arrSet)
	    }
	    let expression = '';
	    //按名称
	    if (_name && _fuzzyQuery) {
	      let reg = new RegExp(_name);
	      _regResult = _parent.query(reg, {
	        recursive: _containsChild
	      });
	    } else if (_name) {
	      expression = _name;
	    }
	    //按照id
	    if (_id) {
	      if (_chainQuery) {
	        expression ? expression += `&&#${_id}` : expression = `#${_id}`;
	      } else {
	        expression ? expression += `||#${_id}` : expression = `#${_id}`;
	      }
	    }
	    //按标签
	    if (_tag && _tag !== 'choose') {
	      if (_chainQuery) {
	        _parent = _regResult || _parent;
	      }
	      _tagResult = _parent.query(function (object) {
	        return object.tags.has(_tag);
	      });
	    }
	    //按属性
	    if (_attribute) {
	      _attribute = _attribute.replace(/\s*/g, "");
	      //按类型
	      if (_attribute && _attribute.indexOf('type=') === 0) {
	        let _type = _attribute.split('type=')[1];
	        if (_chainQuery) {
	          expression ? expression += `&&.${_type}` : expression = `.${_type}`;
	        } else {
	          expression ? expression += `||.${_type}` : expression = `.${_type}`;
	        }
	      } else if (_attribute) {
	        if (_chainQuery) {
	          expression ? expression += `&&[${_attribute}]` : expression = `[${_attribute}]`;
	        } else {
	          expression ? expression += `||[${_attribute}]` : expression = `[${_attribute}]`;
	        }
	      }
	    }
	    if (expression) {
	      if (_chainQuery) {
	        _parent = _tagResult || _regResult || _parent;
	        _otherResult = _parent.query(expression);
	      } else {
	        _otherResult = _parent.query(expression, {
	          recursive: _containsChild
	        });
	      }
	    }

	    let _result = new THING.Selector();
	    let objects = [];
	    if (_chainQuery) {
	      let result = _otherResult || _tagResult || _regResult;
	      objects = result ? result.objects : [];
	    } else {
	      if (_regResult && _regResult.length) {
	        objects = objects.concat(_regResult.objects);
	      }
	      if (_tagResult && _tagResult.length) {
	        objects = objects.concat(_tagResult.objects);
	      }
	      if (_otherResult && _otherResult.length) {
	        objects = objects.concat(_otherResult.objects);
	      }
	    }
	    _result.push(unique(objects));
	    outputs['allResult'] = _result;
	  }
	}

	class BPCloneObject extends BaseNode3D {
	    static config = {
	        name: 'BPCloneObject',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'result',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._result = new THING.Selector();
	    }

	    onExecute(data, inputs, outputs) {
	        this._object = inputs['object'] || new THING.Selector();

	        if (this._object.length && this._object.isSelector) {
	            const len = this._object.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (this._object[idx]) {
	                        this._result.push(this._object[idx].clone());
	                    }
	                }
	            }
	        }
	        // if (this._object) {
	        //     this._result = this._object.clone();
	        //     outputs['result'] = this._result
	        // }
	        outputs['object'] = this._result;
	    }

	    onStop() {
	        const len = this._result.length;
	        if (len && len > 0) {
	            this._result.destroy();
	            this._result.clear();
	        }
	        // if (this._result) {
	        //     this._result.destroy();
	        // }
	    }
	}

	class BPObjectGetParent extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetParent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'parent',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	        this._result = new THING.Selector();
	    }

	    // 当添加节点时被调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            if (_objCtr[0]) {
	                this._result.push(_objCtr[0].parent);
	            }
	        }
	        outputs['parent'] = this._result;
	    }
	}

	class BPObjectGetChildrenNodes extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetChildrenNodes',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'childObject',
	                type: 'selector',
	            }
	        ]
	    }

	    // 当添加节点时被调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let result = new THING.Selector();

	        if (_objCtr.isSelector) {
	            if (_objCtr._objects[0]) {
	                const _objChildCtr = _objCtr._objects[0].children.objects;
	                const len = _objChildCtr.length;

	                if (len > 0) {
	                    for (let idx = 0; idx < len; idx++) {
	                        if (_objChildCtr[idx]) {
	                            result.push(_objChildCtr[idx]);
	                        }
	                    }

	                }
	            }
	        }
	        outputs['childObject'] = result;
	    }
	}

	class BPObjectGetBrothers extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetBrothers',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'brothers',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	        this._result = new THING.Selector();
	    }

	    // 当添加节点时被调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            if (_objCtr[0]) {
	                this._result.push(_objCtr[0].brothers);
	            }
	        }
	        outputs['brothers'] = this._result;
	    }
	}

	class BPObjectAddChild extends BaseNode3D {
	    static config = {
	        name: 'BPObjectAddChild',
	        desc: 'obj.add',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'childObject',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ]
	    }

	    // 当添加节点时被调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['childObject'] || new THING.Selector();
	        let _tarCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.length && _tarCtr.length) {
	            const lenObj = _objCtr.length;

	            if (lenObj > 0 && _tarCtr._objects[0]) {
	                for (let idxObj = 0; idxObj < lenObj; idxObj++) {
	                    _tarCtr[0].add(_objCtr._objects[idxObj]);
	                }
	            }
	        }
	    }
	}

	class BPObjectRemoveChild extends BaseNode3D {
	    static config = {
	        name: 'BPObjectRemoveChild',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'target',
	                type: 'selector',
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }

	    // 当删除节点是被调用
	    onExecute(data, inputs, outputs) {
	        let _tarCtr = inputs['target'] || new THING.Selector();
	        let _objCtr = inputs['object'] || new THING.Selector();
	        if (_tarCtr.length && _objCtr.length) {
	            const lenObj = _tarCtr.length;

	            if (lenObj > 0 && _objCtr._objects[0]) {
	                for (let idxObj = 0; idxObj < lenObj; idxObj++) {
	                    _objCtr[0].remove(_tarCtr[idxObj]);
	                }
	            }
	        }
	        // if (_obj && _tar) {
	        //     let res = _obj.remove(_tar);
	        //     outputs['result'] = res;
	        // }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPObjectGetBasicAttribute extends BaseNode3D {
	  static config = {
	    name: 'BPObjectGetBasicAttribute',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'name',
	        type: 'string',
	      },
	      {
	        name: 'id',
	        type: 'string',
	      },
	      {
	        name: 'type',
	        type: 'string',
	      },
	      {
	        name: 'tags',
	        type: 'array',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      }
	    ]
	  }

	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _obj = inputs['object'] || new THING.Selector();

	    if (_obj.length) {
	      const len = _obj.length;
	      switch (len) {
	        case 0:
	          return
	        case 1:
	          outputs['name'] = _obj[0].name;
	          outputs['id'] = _obj[0].id;
	          outputs['type'] = _obj[0].type;
	          if (_obj[0].tags) {
	            outputs['tags'] = Array.from(_obj[0].tags);
	          } else {
	            outputs['tags'] = [];
	          }

	          break
	      }
	    }
	  }
	}

	class BPObjectSetBasicAttribute extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSetBasicAttribute',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'name',
	        type: 'string',
	      },
	      {
	        name: 'id',
	        type: 'string',
	      },
	      {
	        name: 'type',
	        type: 'string',
	      },
	      {
	        name: 'tags',
	        type: 'array',
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	    ]
	  }

	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _objCtr = inputs['object'] || new THING.Selector();

	    if (_objCtr.isSelector) {
	      const len = _objCtr.length;

	      if (len > 0) {
	        for (let idx = 0; idx < len; idx++) {
	          inputs['name'] && (_objCtr[idx].name = inputs['name']);
	          inputs['id'] && (_objCtr[idx].id = inputs['id']);
	          inputs['type'] && (_objCtr[idx].type = inputs['type']);
	          inputs['tags'] && (_objCtr[idx].tags = inputs['tags']);
	        }
	      }

	      outputs['object'] = _objCtr;
	    }
	  }
	}

	class BPObjectSetPickable extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSetPickable',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'pickable',
	        type: 'boolean',
	        value: true
	      },
	      {
	        name: 'recursive',
	        type: 'boolean',
	        advanced: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _objCtr = inputs['object'] || new THING.Selector();
	    let _visible = inputs['pickable'] || false;
	    let _recursive = inputs['recursive'];

	    if (_objCtr.isSelector) {
	      const len = _objCtr.length;

	      for (let idx = 0; idx < len; idx++) {
	        _objCtr[idx].setPickable(_visible, _recursive);
	      }
	    }

	    outputs['object'] = _objCtr;
	  }
	}

	class BPObjectAlwaysOnTop extends BaseNode3D {
	    static config = {
	        name: 'BPObjectAlwaysOnTop',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'alwaysOnTop',
	                type: 'boolean',
	                value: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _object = inputs['object'] || new THING.Selector();
	        let _onTop = inputs['alwaysOnTop'] || false;

	        if (_object && _object.isSelector && _object.length > 0) {
	            for (let idx = 0; idx < _object.length; idx++) {
	                if (_object[idx]) {
	                    _object[idx].alwaysOnTop = _onTop;
	                }
	            }


	        }
	        outputs['object'] = _object;
	    }
	}

	class BPObjectShowAxes extends BaseNode3D {
	  static config = {
	    name: 'BPObjectShowAxes',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'axes',
	        type: 'boolean',
	        value: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	    ]
	  }

	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _objCtr = inputs['object'] || new THING.Selector();
	    let _axes = inputs['axes'] || false;

	    if (_objCtr.isSelector) {
	      const len = _objCtr.length;

	      if (len > 0) {
	        for (let idx = 0; idx < len; idx++) {
	          _objCtr[idx].helper.axes = _axes;
	        }
	      }

	    }
	    outputs['object'] = _objCtr;

	  }
	}

	class BPDestroyObject extends BaseNode3D {
	    static config = {
	        name: 'BPDestroyObject',
	        inputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'target',
	            type: 'selector',
	        }
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            }
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        const _tarCtr = inputs['target'] || new THING.Selector();

	        if (_tarCtr.isSelector) {
	            const len = _tarCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_tarCtr[idx]) {
	                        _tarCtr[idx].destroy();
	                    }
	                }
	            }
	        }
	        // if (!_target) return;
	        // if (_target instanceof Array) {
	        //     _target.forEach((obj) => {
	        //         obj.destroy();
	        //     })
	        // } else {
	        //     _target.destroy();
	        // }
	    }
	}

	class BPQueryObjectByDistance extends BaseNode3D {
	  static config = {
	    name: 'BPQueryObjectByDistance',
	    data: [
	      // {
	      //   name: 'tag',
	      //   type: 'select',
	      // },
	    ],
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'centerPosition',
	        type: ['array', 'vector3'],
	      },
	      // {
	      //   name: 'id',
	      //   type: 'string',
	      // },
	      {
	        name: 'centerObject',
	        type: 'selector',
	      },
	      {
	        name: 'tag',
	        type: 'string',
	        // value : ['please choose', 'Vehicle', '公交车', '叉车']
	      },
	      {
	        name: 'radius',
	        type: 'number',
	        value: 10,
	      },
	      //   {
	      //     name: '空间类型',
	      //     type: 'string',
	      //   },
	    ],
	    outputs: [
	      {
	        name: 'complete',
	        type: 'callback',
	      },
	      {
	        name: 'queryObject',
	        type: 'selector',
	      },
	      {
	        name: 'centerObject',
	        type: 'selector',
	        advanced: true,
	      },
	    ],
	    validator: function (connectedPins, node) {
	      const { inputs } = connectedPins;
	      const hasConnectedExec = inputs.find(
	        (t) => node.getInput(t)?.type === 'exec'
	      );
	      const hasConnectedObject = inputs.find(
	        (t) => t === 'centerPosition' || t === 'centerObject'
	      );
	      if (hasConnectedExec && !hasConnectedObject) {
	        return {
	          error: `《${node.title}》没有连接坐标或对象`,
	        }
	      }
	    },
	  }

	  onStop() {
	    if (this.monitorTarget) {
	      this.monitorTarget.style.color = null;
	    }
	  }

	  // 临时保存一下数据
	  _tempData(selector, theNeareseObj, pos) {
	    theNeareseObj.forEach((obj) => {
	      if (!obj.userData._monitor_) {
	        obj.userData._monitor_ = {};
	      }
	      // theNeareseObj.userData._monitor_[`path`] = [
	      //   // 这里坐标临时处理了一下。。 高度保持一致，避免行走飞起来
	      //   theNeareseObj.position,
	      //   [pos[0], theNeareseObj.position[1], pos[2]],
	      // ]
	      const targetUuid = obj.uuid;
	      const hasExist = selector.query(`[uuid=${targetUuid}]`);
	      if (hasExist.length) return
	      selector.push(obj);
	    });
	  }
	  async onExecute(data, inputs, outputs) {
	    const app = this.app;
	    const obj = inputs['centerObject'] || new THING.Selector();
	    const _radius = inputs['radius'];
	    const _tag = inputs['tag'];
	    const _pos = inputs['centerPosition'];
	    const selector = new THING.Selector();

	    /// 找一下周边的对象
	    let someObj = !_tag ? app.query('.Thing') : app.query((object) => {
	      return object.tags.has(_tag)
	    });

	    if (obj?.length > 0) {
	      // 查询出来的场景所有对象s
	      if (someObj.length > 0) {
	        let maxMap = {
	          len: _radius,
	          obj: [],
	        };

	        // obj 是传进来的告警目标物体，
	        if (obj.length > 1) {
	          // o 是需要找出来的距离目标最近的
	          let maxArr = [];
	          obj.forEach((fo) => {
	            let maxMapi = {
	              len: _radius,
	              obj: [],
	              tar: null,
	            };
	            // 过滤后的几个，再去处理有限范围
	            someObj
	              // 排除自己
	              .filter((so) => so !== obj)
	              .forEach((o) => {
	                // o 是需要找出来的距离目标最近的
	                const nearDis = THING.MathUtils.getDistance(o.position, [
	                  fo.position[0],
	                  0,
	                  fo.position[2],
	                ]);
	                // 找出最近的
	                if (
	                  nearDis <= maxMapi.len &&
	                  o.parent.uuid === fo.parent.uuid
	                ) {
	                  // maxMapi.len = nearDis
	                  maxMapi.obj.push(o);
	                  maxMapi.tar = fo;
	                }
	              });
	            maxArr.push(maxMapi);
	          });
	          maxArr.forEach((ar) => {
	            this._tempData(selector, ar.obj, ar.tar?.position);
	          });
	          //
	        } else {
	          // 单个对象
	          // o 是需要找出来的距离目标最近的
	          const currentObject = obj[0];
	          someObj
	            // 排除自己
	            .filter((so) => so !== currentObject)
	            .forEach((o) => {
	              //单个
	              const nearDis = THING.MathUtils.getDistance(o.position, [
	                currentObject.position[0],
	                0,
	                currentObject.position[2],
	              ]);
	              if (
	                nearDis <= maxMap.len
	                && o.parent.uuid === currentObject.parent.uuid
	              ) {
	                // maxMap.len = nearDis
	                maxMap.obj.push(o);
	              }
	            });
	          this._tempData(selector, maxMap.obj, currentObject.position);
	        }
	      }
	    }

	    //传入坐标的情况
	    if (_pos) {
	      let maxMap = {
	        len: _radius,
	        obj: [],
	      };
	      someObj.forEach((o) => {
	        //单个
	        const nearDis = THING.MathUtils.getDistance(o.position, _pos);
	        if (
	          nearDis <= maxMap.len &&
	          (!app.level.current ||
	            o.parent.uuid === app.level.current.uuid)
	        ) {
	          // maxMap.len = nearDis
	          maxMap.obj.push(o);
	        }
	      });

	      this._tempData(selector, maxMap.obj, _pos);
	    }

	    // 找出id对于的物体 . position
	    await selector.waitForComplete();
	    outputs['queryObject'] = selector;
	    outputs['centerObject'] = obj;
	    this.run('complete', outputs);
	  }
	}

	class BPObjectSetColor extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetColor',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "color",
	                type: "color",
	                value: '#ffffff'
	            },
	            {
	                name: "gradient",
	                type: "boolean",
	                advanced: true
	            },
	            {
	                name: "startColor",
	                type: "color",
	                advanced: true
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: '1',
	                advanced: true
	            },
	            {
	                name: 'loopType',
	                type: 'select',
	                value: ['Once', 'Repeat', 'PingPong'],
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }

	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        this._object = inputs['object'] || new THING.Selector();
	        let _color = inputs['color'];
	        let _gradient = inputs['gradient'];

	        let _time = handleTime(inputs['time'] || 1);
	        let _loopType = inputs['loopType'] || 'Once';
	        _loopType = THING.LoopType[_loopType];
	        // this.setStyleProp(_object, 'color', _color)
	        if (_gradient) {
	            if (this._object && this._object.length > 0 && this._object.isSelector) {
	                const len = this._object.length;

	                for (let idx = 0; idx < len; idx++) {
	                    let _startColor = inputs['startColor'] || this._object[idx].style.color;
	                    let fromColor = typeof _startColor === 'string' ? parseColor(_startColor) : _startColor;
	                    let from = {
	                        color: fromColor
	                    };
	                    let to = {
	                        color: parseColor(_color)
	                    };

	                    let tween = this.app.tweenManager.lerpTo(from, to, _time)
	                        .looping(_loopType)
	                        .onUpdate(ev => {
	                            if (this._object[idx]) {
	                                this._object[idx].style.color = ev.value.color;
	                            }
	                        });

	                    this._object[idx].setAttribute('colorGradient', tween);
	                }
	            }
	        } else {
	            if (this._object && this._object.length > 0 && this._object.isSelector) {
	                for (let idx = 0; idx < this._object.length; idx++) {
	                    let tween = this._object[idx].getAttribute('colorGradient');
	                    if (tween) {
	                        tween.stop();
	                    }
	                }
	            }
	            this.setStyleProp(this._object, 'color', _color);
	        }
	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }

	        function parseColor(color) {
	            // [0~1, 0~1, 0~1]
	            if (Array.isArray(color)) {
	                return color;
	            }// String: '#FFFFFF'
	            else {
	                if (color[0] == '#') {
	                    var r = parseInt(color.substr(1, 2), 16) / 255;
	                    var g = parseInt(color.substr(3, 2), 16) / 255;
	                    var b = parseInt(color.substr(5, 2), 16) / 255;
	                    return [r, g, b];
	                }
	            }
	            return [0, 0, 0]
	        }
	        outputs['object'] = this._object;
	    }

	    onStop() {
	        if (this._object && this._object.length > 0 && this._object.isSelector) {
	            for (let idx = 0; idx < this._object.length; idx++) {
	                let tween = this._object[idx].getAttribute('colorGradient');
	                if (tween) {
	                    tween.stop();
	                }
	            }
	        }
	    }
	}

	class BPObjectCancelColor extends BaseNode3D {
	    static config = {
	        name: 'BPObjectCancelColor',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let _object = inputs['object'] || new THING.Selector();
	        if (_object && _object.length > 0 && _object.isSelector) {
	            for (let idx = 0; idx < _object.length; idx++) {
	                let tween = _object[idx].getAttribute('colorGradient');
	                if (tween) {
	                    tween.stop();
	                }
	            }
	        }
	        this.setStyleProp(_object, 'color', null);
	        outputs['object'] = _object;
	    }
	}

	class BPObjectSetOutline extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSetOutline',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'outlineColor',
	        type: 'color',
	        value: '#ffffff'
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _object = inputs['object'] || new THING.Selector();
	    let _color = inputs['outlineColor'];
	    this.setStyleProp(_object, 'outlineColor', _color);

	    outputs['object'] = _object;
	  }
	}

	class BPObjectCancelOutline extends BaseNode3D {
	  static config = {
	    name: 'BPObjectCancelOutline',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _object = inputs['object'] || new THING.Selector();
	    this.setStyleProp(_object, 'outlineColor', null);

	    outputs['object'] = _object;
	  }
	}

	class BPObjectSetOpacity extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetOpacity',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "opacity",
	                type: "number",
	                value: 1
	            },
	            {
	                name: "gradient",
	                type: "boolean",
	                advanced: true
	            },
	            {
	                name: 'startOpacity',
	                type: 'number',
	                advanced: true
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: '1',
	                advanced: true
	            },
	            {
	                name: 'loopType',
	                type: 'select',
	                value: ['Once', 'Repeat', 'PingPong'],
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        this._object = inputs['object'];
	        let _opacity = inputs['opacity'];
	        this._gradient = inputs['gradient'];
	        let _startOpacity = inputs['startOpacity'];
	        let _time = handleTime(inputs['time'] || 1);
	        let _loopType = inputs['loopType'] || 'Once';
	        _loopType = THING.LoopType[_loopType];

	        if (this._gradient) {
	            if (this._object && this._object.length > 0 && this._object.isSelector) {
	                const len = this._object.length;

	                for (let idx = 0; idx < len; idx++) {
	                    let from = {
	                        opacity: _startOpacity ? _startOpacity : this._object[idx].style.opacity
	                    };
	                    let to = {
	                        opacity: _opacity
	                    };


	                    let tween = this.app.tweenManager.lerpTo(from, to, _time)
	                        .looping(_loopType)
	                        .onUpdate(ev => {
	                            if (this._object[idx]) {
	                                this._object[idx].style.opacity = ev.value.opacity;
	                            }
	                        });

	                    this._object[idx].setAttribute('opacityGradient', tween);
	                }
	            }

	        } else {
	            if (this._object && this._object.length > 0 && this._object.isSelector) {
	                for (let idx = 0; idx < this._object.length; idx++) {
	                    let tween = this._object[idx].getAttribute('opacityGradient');
	                    if (tween) {
	                        tween.stop();
	                    }
	                }
	            }
	            if (_opacity != 0) {
	                _opacity = _opacity || 1;
	            }
	            this.setStyleProp(this._object, 'opacity', _opacity);
	        }

	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }

	        outputs['object'] = this._object;
	    }

	    onStop() {
	        if (this._gradient && this._object && this._object.length > 0 && this._object.isSelector) {
	            for (let idx = 0; idx < this._object.length; idx++) {
	                let tween = this._object[idx].getAttribute('opacityGradient');
	                if (tween) {
	                    tween.stop();

	                }
	            }
	        }
	    }
	}

	class BPObjectSetFlash extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSetFlash',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'flash',
	        type: 'boolean',
	        value: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _objCtr = inputs['object'] || new THING.Selector();
	    let _flash = inputs['flash'];
	    var app = this.app;

	    if (_objCtr.length && _flash) {
	      const len = _objCtr.length;

	      if (len > 0) {
	        for (let idx = 0; idx < len; idx++) {
	          if (_objCtr[idx].isPrefabObject) {
	            _objCtr[idx].traverse(child => {
	              child.on('update', function () {
	                child.style.opacity = 0.5 + 0.5 * Math.sin(10 * app.elapsedTime);
	              }, '每帧改变透明度');
	            });
	          } else {
	            _objCtr[idx].on('update', function () {
	              _objCtr[idx].style.opacity = 0.5 + 0.5 * Math.sin(10 * app.elapsedTime);
	            }, '每帧改变透明度');
	          }
	        }
	      }
	    } else {
	      const len = _objCtr.length;

	      if (len > 0) {
	        for (let idx = 0; idx < len; idx++) {
	          if (_objCtr[idx].isPrefabObject) {
	            _objCtr[idx].traverse(child => {
	              child.off('update', '每帧改变透明度');
	            });
	          } else {
	            _objCtr[idx].off('update', '每帧改变透明度');
	          }
	        }
	      }
	    }

	    outputs['object'] = _objCtr;
	  }
	}

	class BPObjectSetVisible extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSetVisible',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'visible',
	        type: 'boolean',
	        value: true
	      },
	      {
	        name: 'recursive',
	        type: 'boolean',
	        value: true,
	        advanced: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _objCtr = inputs['object'] || new THING.Selector();
	    let _visible = inputs['visible'] || false;
	    let _recursive = inputs['recursive'];

	    if (_objCtr.isSelector) {
	      const len = _objCtr.length;

	      for (let idx = 0; idx < len; idx++) {
	        _objCtr[idx].setVisible(_visible, _recursive);
	      }
	    }

	    outputs['object'] = _objCtr;
	  }
	}

	class BPObjectSetColorFlash extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetColorFlash',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "color1",
	                type: "color",
	                value: 'red'
	            },
	            {
	                name: "color2",
	                type: "color",
	                value: 'green'
	            },
	            {
	                name: "flashTime",
	                type: "number",
	                value: 1
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	        this.timer;
	    }
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let _flashTime = inputs['flashTime'];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                // 设置初始颜色
	                for (let idx = 0; idx < len; idx++) {
	                    _objCtr[idx].userData.color = inputs['color2'];
	                }
	                clearInterval(this.timer);
	                // 设置interval来改变时间
	                this.timer = setInterval(function () {
	                    for (let idxInter = 0; idxInter < len; idxInter++) {
	                        if (_objCtr[idxInter].isPrefabObject) {
	                            if (_objCtr[idxInter].userData.color == inputs['color1']) {
	                                _objCtr[idxInter].userData.color = inputs['color2'];
	                                _objCtr[idxInter].traverse(child => {
	                                    child.style.color = inputs['color2'];
	                                });
	                            } else {
	                                _objCtr[idxInter].userData.color = inputs['color1'];
	                                _objCtr[idxInter].traverse(child => {
	                                    child.style.color = inputs['color1'];
	                                });
	                            }
	                        } else {
	                            if (_objCtr[idxInter].userData.color == inputs['color1']) {
	                                _objCtr[idxInter].userData.color = inputs['color2'];
	                                _objCtr[idxInter].style.color = inputs['color2'];
	                            } else {
	                                _objCtr[idxInter].userData.color = inputs['color1'];
	                                _objCtr[idxInter].style.color = inputs['color1'];
	                            }
	                        }
	                    }
	                }, _flashTime * 1000);
	            }
	        }

	        outputs['object'] = _objCtr;
	    }

	    onStop() {
	        clearInterval(this.timer);
	    }
	}

	class BPShowBoundingBox extends BaseNode3D {
	  static config = {
	    name: 'BPShowBoundingBox',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'show',
	        type: 'boolean',
	        value: true,
	      },
	      {
	        name: 'BoxType',
	        type: 'select',
	        value: ['AABB', 'OBB']
	      }
	    ],
	    outputs: [{
	      name: 'next',
	      type: 'exec',
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    }],
	  }

	  constructor() {
	    super();
	  }

	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let BoxType = inputs['BoxType'] || 'AABB';
	    let _objCtr = inputs['object'] || new THING.Selector();
	    let _isShow = inputs['show'];

	    if (_objCtr.isSelector) {
	      const len = _objCtr.length;

	      for (let idx = 0; idx < len; idx++) {
	        if (_objCtr[idx]) {
	          _isShow ? showBoundingBox(_objCtr[idx]) : hiddenBoundingBox(_objCtr[idx]);
	        }
	      }

	      outputs['object'] = _objCtr;
	    }

	    function showBoundingBox(_object) {
	      if (BoxType === 'AABB') {
	        _object.helper.boundingBox.visible = true;
	      } else {
	        _object.helper.orientedBox.visible = true;
	      }
	    }

	    function hiddenBoundingBox(_object) {
	      if (BoxType === 'AABB') {
	        _object.helper.boundingBox.visible = false;
	      } else {
	        _object.helper.orientedBox.visible = false;
	      }
	    }

	  }
	  // 当蓝图停止时被调用
	  onStop() { }

	}

	class BPObjectSetWireframe extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetWireframe',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'wireframe',
	                type: 'boolean',
	                value: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }

	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let _object = inputs['object'];
	        this.setStyleProp(_object, 'wireframe', inputs['wireframe']);
	        outputs['object'] = _object;
	    }
	}

	class BPObjectSetTexture extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetTexture',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "image",
	                type: "string",
	                value: `${BaseNode3D.BASEURL}image/alarm_build.png`
	            },
	            {
	                name: 'repeat',
	                type: 'vector2',
	                value: [1, 1],
	                advanced: true
	            },
	            {
	                name: 'offset',
	                type: 'vector2',
	                value: [0, 0],
	                advanced: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let _object = inputs['object'] || new THING.Selector();
	        let _image = inputs['image'];
	        let _uvStyle = { repeat: inputs['repeat'], offset: inputs['offset'] };
	        let _texture = new THING.ImageTexture(_image);
	        this.setStyleProp(_object, 'image', _texture);
	        this.setStyleProp(_object, 'uv', _uvStyle);
	        outputs['object'] = _object;
	    }
	}

	class BPObjectCancelTexture extends BaseNode3D {
	    static config = {
	        name: 'BPObjectCancelTexture',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let _object = inputs['object'] || new THING.Selector();
	        this.setStyleProp(_object, 'image', null);
	        outputs['object'] = _object;
	    }
	}

	class BPObjectSetTransformControl extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetTransformControl',
	        group: 'Custom',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: 'mode',
	            type: 'select',
	            value: ['translate', 'angle', 'scale'],
	        }
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector'
	        }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        this._objCtr = inputs['object'] || new THING.Selector();
	        this._tag = 'TransformControlTag';
	        this._mode = inputs['mode'];

	        if (this._objCtr.isSelector) {
	            if (!this._objCtr.controlObject) {
	                this.controlObject = new THING.BaseObject3D();
	                const component = new THING.EXTEND.TransformControlComponent();
	                this.controlObject.addComponent(component, this._tag);
	                this._objCtr.controlObject = this.controlObject;
	                this.controlObject[this._tag].setObjects(this._objCtr, false);
	            }
	            this._objCtr.controlObject.TransformControlTag.mode = this._mode;

	        }

	        outputs['object'] = this._objCtr;

	    }
	    onStop() {
	        if (this.controlObject) {
	            this.controlObject.removeComponent(this._tag);
	        }
	        this._objCtr.destroy();
	        this._objCtr.clear();
	    }
	}

	class BPObjectCancelTransformControl extends BaseNode3D {
	    static config = {
	        name: 'BPObjectCancelTransformControl',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        this._tag = 'TransformControlTag';

	        if (_objCtr.controlObject)
	            _objCtr.controlObject.removeComponent(this._tag);


	        outputs['object'] = _objCtr;
	    }
	    onStop() {

	    }
	}

	class BPObjectSetEdge extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetEdge',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "enable",
	                type: "boolean",
	                value: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff'
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let _enable = inputs['enable'];

	        if (_objCtr.length && _enable) {
	            const len = _objCtr.length;

	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx].isPrefabObject) {
	                    _objCtr[idx].traverse(child => {
	                        child.style.edge.enable = true;
	                        child.style.edge.color = inputs['color'];
	                    });
	                } else {
	                    _objCtr[idx].style.edge.enable = true;
	                    _objCtr[idx].style.edge.color = inputs['color'];
	                }
	            }
	        } else {
	            const len = _objCtr.length;

	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx].isPrefabObject) {
	                    _objCtr[idx].traverse(child => {
	                        child.style.edge.enable = false;
	                    });
	                } else {
	                    _objCtr[idx].style.edge.enable = false;
	                }
	            }
	        }

	        outputs['object'] = _objCtr;

	        // if (_object && _enable) {
	        // 	if (_object instanceof Array) {
	        // 		_object.forEach((obj) => {
	        // 			// 如果是预制件，则需要递归子对象设置
	        // 			if (obj.isPrefabObject) {
	        // 				obj.traverse(child => {
	        //                     child.style.edge.enable = true
	        //                     child.style.edge.color = inputs['color']
	        // 				});
	        // 			} else {
	        // 				obj.style.edge.enable = true
	        //                 obj.style.edge.color = inputs['color']
	        // 			}
	        // 		})
	        // 	} else if (_object.isPrefabObject) {// 如果是预制件，则需要递归子对象设置
	        // 		_object.traverse(child => {
	        // 			child.style.edge.enable = true
	        //             child.style.edge.color = inputs['color']
	        // 		});
	        // 	}
	        // 	else {
	        //         _object.style.edge.enable = true
	        //         _object.style.edge.color = inputs['color']
	        // 	}
	        // }else {
	        //     if (_object instanceof Array) {
	        // 		_object.forEach((obj) => {
	        // 			// 如果是预制件，则需要递归子对象设置
	        // 			if (obj.isPrefabObject) {
	        // 				obj.traverse(child => {
	        //                     child.style.edge.enable = false
	        // 				});
	        // 			} else {
	        // 				obj.style.edge.enable = false
	        // 			}
	        // 		})
	        // 	} else if (_object.isPrefabObject) {// 如果是预制件，则需要递归子对象设置
	        // 		_object.traverse(child => {
	        // 			child.style.edge.enable = false
	        // 		});
	        // 	}
	        // 	else {
	        //         _object.style.edge.enable = false
	        // 	}
	        // }
	    }
	}

	class BPObjectSetGlow extends BaseNode3D {
	  static config = {
	    name: 'BPObjectSetGlow',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'glow',
	        type: 'number',
	        value: 0.5
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'object',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _object = inputs['object'] || new THING.Selector();
	    this.setStyleProp(_object, 'effect', { glow: inputs['glow'] });

	    outputs['object'] = _object;
	  }
	}

	class BPObjectGetAttribute extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetAttribute',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "name",
	                type: "string",
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'value',
	                type: 'unknown'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = inputs['name'];

	        if (_objCtr.isSelector) {
	            if (_objCtr._objects[0]) {
	                let value = _objCtr._objects[0].getAttribute(_name);

	                try {
	                    value = JSON.parse(value);
	                } catch {
	                    value = value;
	                }

	                outputs['value'] = value;
	                outputs['object'] = _objCtr;
	            }
	        }
	        // let _object = inputs['object']
	        // let _name = inputs['name']
	        // let _value;
	        // if (_object) {
	        //     _value = _object.getAttribute(_name)
	        //     try {
	        //         _value = JSON.parse(_value);
	        //     } catch (error) {
	        //         _value = _value
	        //     }
	        // }
	        // outputs['value'] = _value
	        // outputs['object'] = _object
	    }
	}

	class BPObjectSetAttribute extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetAttribute',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "name",
	                type: "string",
	            },
	            {
	                name: "value",
	                type: "any",
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = inputs['name'];
	        const _value = inputs['value'];
	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                const _objs = _objCtr._objects;
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objs[idx]) {
	                        _objs[idx].setAttribute(_name, _value);
	                    }
	                }
	            }
	            outputs['object'] = _objCtr;
	        }
	    }
	}

	class BPLightSetIntensity extends BaseNode3D {
	    static config = {
	        name: 'BPLightSetIntensity',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "value",
	                type: "number",
	                value: 0.5
	            }
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = 'intensity';
	        const _value = inputs['value'];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                const _objs = _objCtr._objects;
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objs[idx]) {
	                        _objs[idx].setAttribute(_name, _value);
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPLightSetAngle extends BaseNode3D {
	    static config = {
	        name: 'BPLightSetAngle',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "value",
	                type: "number",
	                value: 30
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = 'angle';
	        const _value = inputs['value'];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                const _objs = _objCtr._objects;
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objs[idx]) {
	                        _objs[idx].setAttribute(_name, _value);
	                    }
	                }
	            }
	            outputs['object'] = _objCtr;
	        }
	    }
	}

	class BPLightSetPenumbra extends BaseNode3D {
	    static config = {
	        name: 'BPLightSetPenumbra',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: "value",
	                type: "number",
	                value: 0.5
	            }
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = 'penumbra';
	        const _value = inputs['value'];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                const _objs = _objCtr._objects;
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objs[idx]) {
	                        _objs[idx].setAttribute(_name, _value);
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPLightSetDistance extends BaseNode3D {
	    static config = {
	        name: 'BPLightSetDistance',
	        group: 'Custom',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: "value",
	            type: "number",
	            value: 25
	        }
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector'
	        }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = 'distance';
	        const _value = inputs['value'];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                const _objs = _objCtr._objects;
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objs[idx]) {
	                        _objs[idx].setAttribute(_name, _value);
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPLightSetShadow extends BaseNode3D {
	    static config = {
	        name: 'BPLightSetShadow',
	        group: 'Custom',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: "value",
	            type: "boolean",
	            value: true
	        }
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector'
	        }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _name = 'enableShadow';
	        const _value = inputs['value'];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                const _objs = _objCtr._objects;
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objs[idx]) {
	                        _objs[idx].setAttribute(_name, _value);
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPObjectMoveTo extends BaseNode3D {
	    static config = {
	        name: 'BPObjectMoveTo',
	        group: 'Basic',
	        desc: 'obj.moveTo',
	        inputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: 'position',
	            type: 'vector3',
	            value: [0, 0, 0]
	        },
	        {
	            name: 'time',
	            type: 'number',
	            value: 1
	        },
	        {
	            name: 'loopType',
	            type: 'select',
	            value: ['Once', 'Repeat', 'PingPong'],
	            advanced: true
	        },
	        {
	            name: 'isOrientToPath',
	            type: 'boolean',
	            value: true,
	            advanced: true
	        }

	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'complete',
	            type: 'callback',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        }
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const _position = inputs['position'] || [0, 0, 0];
	        const _time = this.handleTime(inputs['time']);
	        let _loopType = inputs['loopType'] || 'Once';
	        const _isOrientToPath = inputs['isOrientToPath'];
	        _loopType = THING.LoopType[_loopType];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;
	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].moveTo(_position, {
	                            time: _time,
	                            loopType: _loopType,
	                            orientToPath: _isOrientToPath,
	                            complete: () => {
	                                this.run('complete', outputs);
	                            }
	                        });
	                    }
	                }

	                outputs['object'] = _objCtr;
	            }
	        }
	    }

	}

	class BPObjectRotateTo extends BaseNode3D {
	    static config = {
	        name: 'BPObjectRotateTo',
	        group: 'Basic',
	        desc: 'obj.rotateTo obj.rotateOnAxis',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'angles',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: 1
	            },
	            {
	                name: 'angle',
	                type: 'number',
	                advanced: true
	            },
	            {
	                name: 'loopType',
	                type: 'select',
	                value: ['Once', 'Repeat', 'PingPong'],
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        let _angles = inputs['angles'] || [0, 0, 0];
	        let _angle = inputs['angle'];
	        let _time = this.handleTime(inputs['time']);
	        let _loopType = inputs['loopType'] || 'Once';
	        _loopType = THING.LoopType[_loopType];

	        outputs['object'] = _objCtr;

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;
	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx]) {
	                    if (_angle) {
	                        let _axis = _angles;
	                        _objCtr[idx].rotateOnAxis(_axis, _angle);
	                    } else {
	                        _objCtr[idx].rotateTo(_angles, {
	                            time: _time,
	                            loopType: _loopType,
	                            complete: () => {
	                                this.run('complete', outputs);
	                            }
	                        });
	                    }
	                }
	            }
	        }
	    }

	}

	class BPObjectStopRotating extends BaseNode3D {
	    static config = {
	        name: 'BPObjectStopRotating',
	        inputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'target',
	            type: 'selector',
	        }
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['target'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].stopRotating();
	                    }
	                }
	                outputs['object'] = _objCtr;
	            }
	        }
	    }
	}

	class BPObjectScaleTo extends BaseNode3D {
	    static config = {
	        name: 'BPObjectScaleTo',
	        group: 'Basic',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1]
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: 1
	            },
	            {
	                name: 'loopType',
	                type: 'select',
	                value: ['Once', 'Repeat', 'PingPong'],
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        let _size = inputs['scale'] || [0, 0, 0];
	        const _time = handleTime(inputs['time']);
	        let _loopType = inputs['loopType'] || 'Once';
	        _loopType = THING.LoopType[_loopType];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].scaleTo(_size, {
	                            time: _time,
	                            loopType: _loopType,
	                            complete: () => {
	                                this.run('complete', outputs);
	                            }
	                        });
	                    }
	                }

	                outputs['object'] = _objCtr;
	            }
	        }

	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }
	    }
	}

	class BPObjectStopScaling extends BaseNode3D {
	    static config = {
	        name: 'BPObjectStopScaling',
	        inputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'target',
	            type: 'selector',
	        }
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['target'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].stopScaling();
	                    }
	                }

	                outputs['object'] = _objCtr;
	            }
	        }
	    }
	}

	class BPObjectFadeIn extends BaseNode3D {
	    static config = {
	        name: 'BPObjectFadeIn',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: '1',
	                advanced: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                let _time = handleTime(inputs['time'] || 1);

	                outputs['object'] = _objCtr;

	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].fadeIn({
	                            time: _time,
	                            complete: () => {
	                                this.run('complete', outputs);
	                            }
	                        });
	                    }
	                }
	            }
	        }

	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }
	    }
	}

	class BPObjectFadeOut extends BaseNode3D {
	    static config = {
	        name: 'BPObjectFadeOut',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: 1,
	                advanced: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                let _time = handleTime(inputs['time'] || 1);

	                outputs['object'] = _objCtr;

	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].fadeOut({
	                            time: _time,
	                            complete: () => {
	                                this.run('complete', outputs);
	                            }
	                        });
	                    }
	                }
	            }
	        }

	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }
	    }
	}

	class BPObjectStopFading extends BaseNode3D {
	    static config = {
	        name: 'BPObjectStopFading',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;
	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx]) {
	                    _objCtr[idx].stopFading();
	                }
	            }

	            outputs['object'] = _objCtr;
	        }
	    }
	}

	class BPObjectPlayAnimation extends BaseNode3D {
	    static config = {
	        name: 'BPObjectPlayAnimation',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'target',
	            type: 'selector',
	        },
	        {
	            name: 'animationName',
	            type: 'string',
	        },
	        {
	            name: 'loopType',
	            type: 'select',
	            value: ['Once', 'Repeat', 'PingPong'],
	            advanced: true
	        },
	        {
	            name: 'speed',
	            type: 'number',
	            value: 1,
	            advanced: true
	        },
	        {
	            name: 'reverse',
	            type: 'boolean',
	            advanced: true
	        },

	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._objCtr = inputs['target'];
	        this._nameAnimation = inputs['animationName'];
	        const _speed = inputs['speed'] || 0;
	        const _reverse = inputs['reverse'] || false;
	        let _loopType = inputs['loopType'] || 'Once';
	        _loopType = THING.LoopType[_loopType];

	        if (this._objCtr && this._nameAnimation) {
	            const len = this._objCtr.length;
	            for (let idx = 0; idx < len; idx++) {
	                if (this._objCtr[idx]) {
	                    if (this._objCtr[idx].animationNames.indexOf(this._nameAnimation) >= 0) {
	                        this._objCtr[idx].playAnimation({
	                            name: this._nameAnimation,
	                            speed: _speed,
	                            reverse: _reverse,
	                            loopType: _loopType
	                        });
	                    }
	                }
	            }
	            outputs['object'] = this._objCtr;
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._objCtr.length && this._nameAnimation) {
	            const len = this._objCtr.length;
	            for (let idx = 0; idx < len; idx++) {
	                if (this._objCtr[idx] && !this._objCtr[idx].destroyed) {
	                    if (this._objCtr[idx].animationNames.indexOf(this._nameAnimation) >= 0) {
	                        this._objCtr[idx].stopAnimation(this._nameAnimation);
	                    }
	                }
	            }
	        }
	    }
	}

	class BPObjectStopAnimation extends BaseNode3D {
	    static config = {
	        name: 'BPObjectStopAnimation',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'target',
	                type: 'selector',
	            },
	            {
	                name: 'animationName',
	                type: 'string',
	                advanced: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._objCtr = inputs['target'] || new THING.Selector();
	        this._nameAnimation = inputs['animationName'];

	        if (this._objCtr.length) {
	            const len = this._objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (this._objCtr[idx] && this._objCtr[idx].animationNames.indexOf(this._nameAnimation) >= 0) {
	                        this._objCtr[idx].stopAnimation(this._nameAnimation);
	                    } else if (this._objCtr[idx] && !this._nameAnimation) {
	                        this._objCtr[idx].stopAllAnimations();
	                    }
	                }
	            }

	            outputs['object'] = this._object;
	        }
	    }


	    // 当蓝图停止时被调用
	    onStop() {
	    }
	}

	class BPObjectPauseAnimation extends BaseNode3D {
	    static config = {
	        name: 'BPObjectPauseAnimation',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'target',
	                type: 'selector',
	            },
	            {
	                name: 'animationName',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._objCtr = inputs['target'];
	        let _nameAnimation = inputs['animationName'];
	        let _pause = inputs['pause'];

	        if (this._objCtr && this._objCtr.length && _nameAnimation) {
	            const len = this._objCtr.length;

	            for (let idx = 0; idx < len; idx++) {
	                if (this._objCtr[idx].hasAnimation(_nameAnimation)) {
	                    if (_pause) {
	                        this._objCtr[idx].pauseAnimation(_nameAnimation);
	                    } else {
	                        this._objCtr[idx].resumeAnimation(_nameAnimation);
	                    }
	                }
	            }

	            outputs['object'] = this._object;
	        }
	    }
	}

	class BPObjectGetAnimations extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetAnimations',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'animations',
	                type: 'any'
	            }
	        ]
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _object = inputs['object'];

	        if (!_object) {
	            return;
	        }
	        if (_object.length === 0) {
	            return;
	        }
	        let animations = _object[0].animationNames;
	        outputs["animations"] = animations;

	    }
	    onStop() {

	    }

	}

	class BPCreateSpace3D extends BaseNode3D {
	    static config = {
	        name: 'BPCreateSpace3D',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'size',
	                type: 'vector3',
	                value: [1, 1, 1]
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'space',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let {
	            position = [0, 0, 0],
	            size = [1, 1, 1]
	        } = inputs;

	        let space = new THING.Space3D({
	            position,
	            size
	        });

	        this._objects.push(space);
	        outputs['space'] = this.toSelector(space);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }
	}

	class BPSpaceShowBounding extends BaseNode3D {
	  static config = {
	    name: 'BPSpaceShowBounding',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'space',
	        type: 'selector',
	      },
	      {
	        name: 'show',
	        type: 'boolean',
	        value: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'space',
	        type: 'selector'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }

	  //当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _objCtr = inputs['space'] || new THING.Selector();

	    if (_objCtr.isSelector) {
	      const len = _objCtr.length;

	      for (let idx = 0; idx < len; idx++) {
	        _objCtr[idx].showBounding();
	      }
	    }

	    outputs['space'] = _objCtr;
	  }
	}

	class BPSpaceIsContains extends BaseNode3D {
		static config = {
			name: 'BPSpaceIsContains',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'space',
					type: 'selector'
				},
				{
					name: 'object',
					type: 'selector'
				}
			],
			outputs: [
				{
					name: 'contains',
					type: 'callback'
				},
				{
					name: 'noContains',
					type: 'callback'
				},
				{
					name: 'space',
					type: 'selector',
					advanced: true,
				},
				{
					name: 'object',
					type: 'selector',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
		}
		onExecute(data, inputs, outputs) {
			let space = inputs.space || new Selector();
			let object = inputs.object || new Selector();
			outputs.space = space;
			outputs.object = object;

			if (space.length && object.length) {
				let efficientSpace = space[0];
				let efficientObject = object[0];
				if (efficientSpace.contains(efficientObject, true)) {
					this.run('contains', outputs);
				} else {
					this.run('noContains', outputs);
				}
			}

		}
		onStop() {

		}
	}

	class BPSpaceIsIntersects extends BaseNode3D {
		static config = {
			name: 'BPSpaceIsIntersects',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'space',
					type: 'selector'
				},
				{
					name: 'object',
					type: 'selector'
				}
			],
			outputs: [
				{
					name: 'intersects',
					type: 'callback'
				},
				{
					name: 'noIntersects',
					type: 'callback'
				},
				{
					name: 'space',
					type: 'selector',
					advanced: true,
				},
				{
					name: 'object',
					type: 'selector',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
		}
		onExecute(data, inputs, outputs) {
			let space = inputs.space;
			let object = inputs.object;
			outputs.space = space;
			outputs.object = object;
			if (space.length && object.length) {
				let efficientSpace = space[0];
				let efficientObject = object[0];
				if (efficientSpace.intersects(efficientObject, true)) {
					this.run('intersects', outputs);
				} else {
					this.run('noIntersects', outputs);
				}
			}
		}
		onStop() {

		}
	}

	class BPSpaceIsDisjoint extends BaseNode3D {
		static config = {
			name: 'BPSpaceIsDisjoint',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'space',
					type: 'selector'
				},
				{
					name: 'object',
					type: 'selector'
				}
			],
			outputs: [
				{
					name: 'disjoint',
					type: 'callback'
				},
				{
					name: 'noDisjoint',
					type: 'callback'
				},
				{
					name: 'space',
					type: 'selector',
					advanced: true,
				},
				{
					name: 'object',
					type: 'selector',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
		}
		onExecute(data, inputs, outputs) {
			let space = inputs.space;
			let object = inputs.object;
			outputs.space = space;
			outputs.object = object;
			if (space.length && object.length) {
				let efficientSpace = space[0];
				let efficientObject = object[0];
				if (efficientSpace.disjoint(efficientObject, true)) {
					this.run('disjoint', outputs);
				} else {
					this.run('noDisjoint', outputs);
				}
			}
		}
		onStop() {

		}
	}

	class BPObjectGetPosition extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetPosition',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	            }
	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                if (_objCtr[0]) {
	                    outputs['position'] = _objCtr[0].position;
	                    outputs['object'] = _objCtr;
	                }
	            }
	        }
	    }
	}

	class BPObjectSetPosition extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetPosition',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let _position = inputs['position'] || [0, 0, 0];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].position = _position;
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }

	}

	class BPObjectRotateOnAxis extends BaseNode3D {
	    static config = {
	        name: 'BPObjectRotateOnAxis',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: 'axis',
	            type: 'select',
	            value: ['X', 'Y', 'Z'],
	        },
	        {
	            name: 'angles',
	            type: 'number',
	            value: 0
	        },
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector'
	        }

	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let _axis = inputs['axis'] || 'X';
	        let _angles = inputs['angles'] || 0;

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        let axisArr;
	                        switch (_axis) {
	                            case 'X':
	                                axisArr = [1, 0, 0];
	                                break;
	                            case 'Y':
	                                axisArr = [0, 1, 0];
	                                break;
	                            case 'Z':
	                                axisArr = [0, 0, 1];
	                                break;
	                            default:
	                                axisArr = [1, 0, 0];
	                        }
	                        _objCtr[idx].rotateOnAxis(axisArr, _angles);
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPObjectTranslate extends BaseNode3D {
	    static config = {
	        name: 'BPObjectTranslate',
	        desc: 'obj.translate',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'offset',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'distance',
	                type: 'number',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let _offset = inputs['offset'] || [0, 0, 0];
	        let _distance = inputs['distance'];
	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;
	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx]) {
	                    if (_distance) {
	                        let _axis = _offset;
	                        _objCtr[idx].translateOnAxis(_axis, _distance);
	                    } else {
	                        _objCtr[idx].translate(_offset);
	                    }
	                }
	            }
	        }
	        outputs['object'] = _objCtr;

	    }
	}

	class BPObjectLookAt extends BaseNode3D {
	    static config = {
	        name: 'BPObjectLookAt',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: 'target',
	            type: 'vector3',
	            value: [0, 0, 0]
	        },
	        {
	            name: 'targetObject',
	            type: 'selector',
	        },
	        {
	            name: 'onPlane',
	            type: 'boolean',
	            advanced: true
	        },
	        {
	            name: 'alwaysLookat',
	            type: 'boolean',
	            advanced: true
	        }
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        }, {
	            name: 'object',
	            type: 'selector'
	        }]
	    }

	    constructor() {
	        super();
	    }

	    // 当看向某物时调用
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        let _targetObject = inputs['targetObject'] || new THING.Selector();
	        let _tar = inputs['target'] || [0, 0, 0];
	        let _target;
	        const _onPlane = inputs['onPlane'];
	        const _alwaysLookAt = inputs['alwaysLookat'] || true;
	        const _lockAxis = _onPlane ? THING.AxisType.Y : null;
	        if (_targetObject && _targetObject.isSelector && _targetObject.length > 0) {
	            _target = _targetObject[0];
	        } else if (_tar && _tar.length > 0) {
	            _target = _tar;
	        }
	        if (_objCtr.length) {
	            const len = _objCtr.length;
	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx]) {
	                    _objCtr[idx].lookAt(_target, {
	                        always: _alwaysLookAt,
	                        lockAxis: _lockAxis
	                    });
	                }
	            }
	        }
	        outputs['object'] = _objCtr;
	    }
	}

	class BPObjectMovePath extends BaseNode3D {

	    static config = {
	        name: 'BPObjectMovePath',
	        desc: 'obj.movePath',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'path',
	                type: 'any',
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: '5'
	            },
	            {
	                name: 'loopType',
	                type: 'select',
	                value: ['Once', 'Repeat', 'PingPong'],
	                advanced: true
	            },
	            {
	                name: 'turnByPath',
	                type: 'boolean',
	                value: true,
	                advanced: true,
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            outputs['object'] = _objCtr;

	            if (len > 0) {
	                let _time = handleTime(inputs['time']);

	                if (_time <= 0) {
	                    return
	                }
	                let turnByPath = inputs['turnByPath'];
	                let _loopType = inputs['loopType'] || 'Once';
	                _loopType = THING.LoopType[_loopType];

	                let _path = inputs['path'] || [
	                    [10, 0, 0],
	                    [10, 0, 10],
	                    [0, 0, 10],
	                    [0, 0, 0],
	                ];

	                if (typeof _path == 'string') {
	                    _path = JSON.parse(_path);
	                }

	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].movePath(_path, {
	                            time: _time,
	                            loopType: _loopType,
	                            orientToPath: turnByPath,
	                            complete: () => {
	                                this.run('complete', outputs);
	                            }
	                        });
	                    }
	                }
	            }

	        }

	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }
	    }
	}

	class BPObjectGetPivot extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetPivot',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'target',
	                type: 'selector',
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            },
	            {
	                name: 'pivot',
	                type: 'array',
	            }
	        ]
	    }
	    // 当获取到节点时调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['target'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0 && _objCtr[0]) {
	                outputs['pivot'] = _objCtr[0].pivot;
	                outputs['object'] = _objCtr;
	            }
	        }
	    }
	}

	class BPObjectSetPivot extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetPivot',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'target',
	            type: 'selector',
	        },
	        {
	            name: 'pivot',
	            type: 'vector3',
	            value: [0, 0, 0]
	        },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    // 当修改节点时调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['target'] || new THING.Selector();
	        let _pivot = inputs['pivot'] || [0, 0, 0];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            for (let idx = 0; idx < len; idx++) {
	                if (_objCtr[idx]) {
	                    _objCtr[idx].pivot = _pivot;
	                }
	            }

	            outputs['object'] = _objCtr;
	        }
	    }
	}

	class BPObjectSetRotation extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetRotation',
	        group: 'Basic',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        const rotation = inputs['rotation'] || [0, 0, 0];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].rotation = rotation;
	                    }
	                }


	            }
	            outputs['object'] = _objCtr;
	        }
	    }

	}

	class BPObjectGetRotation extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetRotation',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'target',
	                type: 'selector',
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            },
	            {
	                name: 'rotation',
	                type: ['array', 'vector3'],
	            }
	        ]
	    }
	    // 当获取到节点时调用
	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['target'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0 && _objCtr[0]) {
	                outputs['rotation'] = _objCtr[0].rotation;
	                outputs['object'] = _objCtr;
	            }
	        }
	    }
	}

	class BPObjectGetScale extends BaseNode3D {
	    static config = {
	        name: 'BPObjectGetScale',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	            }
	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                if (_objCtr[0]) {
	                    outputs['scale'] = _objCtr[0].scale;
	                    outputs['object'] = _objCtr;
	                }
	            }
	        }
	    }
	}

	class BPObjectSetScale extends BaseNode3D {
	    static config = {
	        name: 'BPObjectSetScale',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1]
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }
	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['object'] || new THING.Selector();
	        let _scale = inputs['scale'] || [1, 1, 1];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].scale = _scale;
	                    }
	                }
	            }
	            outputs['object'] = _objCtr;
	        }
	    }

	}

	class BPObjectStopMoving extends BaseNode3D {
	    static config = {
	        name: 'BPObjectStopMoving',
	        inputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'target',
	            type: 'selector',
	        },
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'object',
	            type: 'selector'
	        }
	        ]
	    }

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _objCtr = inputs['target'] || new THING.Selector();

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                for (let idx = 0; idx < len; idx++) {
	                    if (_objCtr[idx]) {
	                        _objCtr[idx].stopMoving();
	                    }
	                }
	            }
	            outputs['object'] = _objCtr;
	        }
	    }
	}

	class BPCreateRelationShip extends BaseNode3D {
	    static config = {
	        name: 'BPCreateRelationShip',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'type',
	                type: 'string',
	            },
	            {
	                name: 'name',
	                type: 'string',
	            },
	            {
	                name: 'source',
	                type: 'selector',
	            },
	            {
	                name: 'target',
	                type: ['selector', 'array'],
	            },
	            {
	                name: 'queryDirection',
	                type: 'select',
	                value: ['Out', 'In', 'InOut', 'None']
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'relationship',
	                type: 'object',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this.relationships = [];
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let type = inputs['type'];
	        let name = inputs['name'];
	        let source = inputs['source'];
	        let target = inputs['target'];
	        let queryDirection = inputs['queryDirection'];

	        let relationship = new THING.Relationship({
	            type,
	            name,
	            source,
	            target,
	            queryDirection
	        });


	        this.relationships.push(relationship);
	        outputs['relationship'] = relationship;
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this.relationships.length) {
	            this.relationships.forEach(relationship => {
	                relationship.destroy();
	            });
	        }
	    }
	}

	class BPDestroyRelationShip extends BaseNode3D {
	    static config = {
	        name: 'BPDestroyRelationShip',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'relationship',
	                type: ['object', 'array'],
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this.relationships = [];
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let relationship = inputs['relationship'];
	        if (relationship) {
	            if (THING.Utils.isArray(relationship)) {
	                relationship.forEach(re => {
	                    re.destroy();
	                });
	            } else {
	                relationship.destroy();
	            }
	        }
	    }
	}

	class BPQueryObjectByRelationShip extends BaseNode3D {
	    static config = {
	        name: 'BPQueryObjectByRelationShip',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'type',
	                type: 'string',
	            },
	            {
	                name: 'name',
	                type: 'string',
	            },
	            {
	                name: 'queryDirection',
	                type: 'select',
	                value: ['Out', 'In', 'InOut', 'None']
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this.relationships = [];
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let object = inputs['object'];
	        let type = inputs['type'];
	        let name = inputs['name'];
	        let queryDirection = inputs['queryDirection'];
	        let result = new THING.Selector();

	        if (object && object.isSelector && object.length > 0) {
	            result = object[0].relationship.query({
	                type, name, queryDirection
	            });
	        }

	        outputs['object'] = result;
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this.relationships.length) {
	            this.relationships.forEach(relationship => {
	                relationship.destroy();
	            });
	        }
	    }
	}

	class BPQueryRelationShip extends BaseNode3D {
	    static config = {
	        name: 'BPQueryRelationShip',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'type',
	                type: 'string',
	            },
	            {
	                name: 'name',
	                type: 'string',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'relationship',
	                type: 'array',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this.relationships = [];
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let type = inputs['type'];
	        let name = inputs['name'];
	        let app = this.app;

	        let result = app.queryRelationships({
	            type,
	            name
	        });

	        outputs['relationship'] = result;
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this.relationships.length) {
	            this.relationships.forEach(relationship => {
	                relationship.destroy();
	            });
	        }
	    }
	}

	class BPCreateSpotLight extends BaseNode3D {
	    static config = {
	        name: 'BPCreateSpotLight',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'position',
	            type: 'vector3',
	            value: [0, 0, 0]
	        },
	        // {
	        //     name: 'target',
	        //     type: 'vector3',
	        //     value: [0, 0, 0]
	        // },
	        {
	            name: 'intensity',
	            type: 'number',
	            value: 0.7,
	        },
	        {
	            name: 'angle',
	            type: 'number',
	            value: 30,
	            advanced: true,
	        },
	        // {
	        //     name: 'penumbra', //半影
	        //     type: 'number',
	        //     value: 0,
	        //     advanced: true,
	        // },
	        {
	            name: 'distance',
	            type: 'number',
	            value: 100,
	            advanced: true,
	        },
	        {
	            name: 'color',
	            type: 'color',
	            value: '#FFFFFF',
	            advanced: true,
	        },
	        {
	            name: 'enableShadow',
	            type: 'boolean',
	            advanced: true,
	        },
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'lightObject',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();

	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        const _position = inputs['position'] || [0, 0, 0];
	        // const _target = inputs['target'] || [0, 0, 0];
	        const _intensity = inputs['intensity'] || 0.7;
	        const _enableShadow = inputs['enableShadow'];
	        const _angle = inputs['angle'];
	        const _color = inputs['color'];
	        // const _penumbra = inputs['penumbra']
	        const _distance = inputs['distance'];

	        // if (!this.lightObject) {
	        let lightObject = new THING.SpotLight();
	        // }
	        lightObject.enableShadow = _enableShadow;
	        lightObject.position = _position;
	        //  lightObject.lookAt(_target, { always: true });
	        lightObject.intensity = _intensity;
	        lightObject.angle = _angle;
	        lightObject.color = _color;
	        // lightObject.penumbra = _penumbra
	        lightObject.distance = _distance;

	        this._objects.push(lightObject);
	        outputs['lightObject'] = this.toSelector(lightObject);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._objects.length > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPSetAmbientLight extends BaseNode3D {
	    static config = {
	        name: 'BPSetAmbientLight',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'intensity',
	                type: 'number',
	                value: 0.7
	            },

	            {
	                name: 'color',
	                type: 'color',
	                value: '#FFFFFF'
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ]
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        const _intensity = inputs['intensity'] || 0.7;
	        const _color = inputs['color'] || '#FFFFFF';
	        let app = this.app;
	        //设置前保存当前参数
	        this.initialColor = app.scene.ambientLight.color;
	        this.initIntensity = app.scene.ambientLight.intensity;

	        app.scene.ambientLight.color = _color;
	        app.scene.ambientLight.intensity = _intensity;

	    }
	    // 当蓝图停止时被调用
	    onStop() {
	        this.app.scene.ambientLight.color = this.initialColor;
	        this.app.scene.ambientLight._initIntensity = this.initIntensity;
	    }

	}

	class BPSetMainLight extends BaseNode3D {
	    static config = {
	        name: 'BPSetMainLight',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'intensity',
	            type: 'number',
	            value: 0.7
	        },
	        {
	            name: 'color',
	            type: 'color',
	            value: '#FFFFFF'
	        },
	        {
	            name: 'position',
	            type: 'vector3',
	            value: [0, 0, 0]
	        },
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },]
	    }

	    constructor() {
	        super();
	        this.intensity = this.app.scene.mainLight.intensity;
	        this.color = this.app.scene.mainLight.color;
	        this.position = this.app.scene.mainLight.position;
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        const _intensity = inputs['intensity'] ?? 0.7;
	        const _color = inputs['color'] || '#FFFFFF';
	        const _position = inputs['position'] || [0, 0, 0];

	        let app = this.app;
	        //记录当前环境主光源参数

	        app.scene.mainLight.color = _color;
	        app.scene.mainLight.intensity = _intensity;
	        app.scene.mainLight.position = _position;

	    }
	    // 当蓝图停止时被调用
	    onStop() {
	        this.app.scene.mainLight.color = this.color;
	        this.app.scene.mainLight.intensity = this.intensity;
	        this.app.scene.mainLight.position = this.position;
	    }

	}

	class BPCreateDirectionalLight extends BaseNode3D {
	    static config = {
	        name: 'BPCreateDirectionalLight',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            // {
	            //     name: 'target',
	            //     type: 'vector3',
	            //     value: [0, 0, 0]
	            // },
	            {
	                name: 'intensity',
	                type: 'number',
	                value: 0.7,
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#FFFFFF',
	                advanced: true,
	            },
	            {
	                name: 'enableShadow',
	                type: 'boolean',
	                advanced: true,
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'lightObject',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();

	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        const _position = inputs['position'] || [0, 0, 0];
	        // const _target = inputs['target'] || [0, 0, 0];
	        const _intensity = inputs['intensity'] || 0.7;
	        const _color = inputs['color'] || '#FFFFFF';
	        const _enableShadow = inputs['enableShadow'];

	        let lightObject = new THING.DirectionalLight();
	        lightObject.enableShadow = _enableShadow;
	        lightObject.position = _position;
	        // lightObject.lookAt(_target, { always: true });
	        lightObject.intensity = _intensity;
	        lightObject.color = _color;

	        this._objects.push(lightObject);
	        outputs['lightObject'] = this.toSelector(lightObject);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._objects.length > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateBox extends BaseNode3D {
	    static config = {
	        name: 'BPCreateBox',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'box',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'box'
	            },
	            {
	                name: 'size',
	                type: 'vector3',
	                value: [1, 1, 1]
	            },
	            {
	                name: 'localPosition',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let name = inputs['name'] || 'box';
	        let id = inputs['id'] || 'box';
	        let position = inputs['localPosition'] || [0, 0, 0];
	        let size = inputs['size'] || [1, 1, 1];
	        let rotation = inputs['rotation'] || [0, 0, 0];
	        let scale = inputs['scale'] || [1, 1, 1];
	        let _object = new THING.Box(size[0], size[1], size[2], {
	            id,
	            name,
	            position,
	            style: { color: inputs['color'] },
	            rotation,
	            scale,
	        });

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateCylinder extends BaseNode3D {
	    static config = {
	        name: 'BPCreateCylinder',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'cylinder',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'cylinder'
	            },
	            {
	                name: 'radiusTop',
	                type: 'number',
	                value: 1
	            },
	            {
	                name: 'radiusBottom',
	                type: 'number',
	                value: 1
	            },
	            {
	                name: 'height',
	                type: 'number',
	                value: 2
	            },
	            {
	                name: 'radialSegments',
	                type: 'number',
	                value: 64,
	                advanced: true
	            },
	            {
	                name: 'heightSegments',
	                type: 'number',
	                value: 1,
	                advanced: true
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let name = inputs['name'] || 'box';
	        let id = inputs['id'] || 'box';
	        let radiusTop = inputs['radiusTop'];
	        let radiusBottom = inputs['radiusBottom'];
	        let height = inputs['height'];
	        let radialSegments = inputs['radialSegments'];
	        let heightSegments = inputs['heightSegments'];
	        let position = inputs['position'] || [0, 0, 0];
	        const rotation = inputs['rotation'] || [0, 0, 0];
	        const scale = inputs['scale'] || [1, 1, 1];
	        let _object = new THING.Cylinder({
	            id,
	            name,
	            radiusTop,
	            radiusBottom,
	            height,
	            position,
	            rotation,
	            scale,
	            radialSegments,
	            heightSegments,
	            style: { color: inputs['color'] },
	        });
	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateCapsule extends BaseNode3D {
	    static config = {
	        name: 'BPCreateCapsule',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'capsule',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'capsule'
	            },
	            {
	                name: 'radius',
	                type: 'number',
	                value: 0.5
	            },
	            {
	                name: 'cylinderHeight',
	                type: 'number',
	                value: 1
	            },
	            {
	                name: 'widthSegments',
	                type: 'number',
	                value: 64,
	                advanced: true
	            },
	            {
	                name: 'heightSegments',
	                type: 'number',
	                value: 64,
	                advanced: true
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let name = inputs['name'] || 'box';
	        let id = inputs['id'] || 'box';
	        let radius = inputs['radius'];
	        let cylinderHeight = inputs['cylinderHeight'];
	        let widthSegments = inputs['widthSegments'];
	        let heightSegments = inputs['heightSegments'];
	        let position = inputs['position'] || [0, 0, 0];
	        let rotation = inputs['rotation'] || [0, 0, 0];
	        let scale = inputs['scale'] || [1, 1, 1];
	        let _object = new THING.Capsule({
	            id,
	            name,
	            radius,
	            cylinderHeight,
	            position,
	            rotation,
	            scale,
	            widthSegments,
	            heightSegments,
	            style: { color: inputs['color'] },
	            // complete: async (e)=> {
	            // }
	        });
	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateTorus extends BaseNode3D {
	    static config = {
	        name: 'BPCreateTorus',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'torus',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'torus'
	            },
	            {
	                name: 'radius',
	                type: 'number',
	                value: 0.8
	            },
	            {
	                name: 'tube',
	                type: 'number',
	                value: 0.2
	            },
	            {
	                name: 'radialSegments',
	                type: 'number',
	                value: 64,
	                advanced: true
	            },
	            {
	                name: 'tubularSegments',
	                type: 'number',
	                value: 64,
	                advanced: true
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let name = inputs['name'] || 'box';
	        let id = inputs['id'] || 'box';
	        let radius = inputs['radius'];
	        let tube = inputs['tube'];
	        let radialSegments = inputs['radialSegments'];
	        let tubularSegments = inputs['tubularSegments'];
	        let position = inputs['position'] || [0, 0, 0];
	        let rotation = inputs['rotation'] || [0, 0, 0];
	        let scale = inputs['scale'] || [1, 1, 1];
	        let _object = new THING.Torus({
	            id,
	            name,
	            radius,
	            tube,
	            position,
	            rotation,
	            scale,
	            radialSegments,
	            tubularSegments,
	            style: { color: inputs['color'] },
	            // complete: async (e)=> {
	            // }
	        });
	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreatePlane extends BaseNode3D {
	    static config = {
	        name: 'BPCreatePlane',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'plane',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'plane'
	            },
	            {
	                name: 'size',
	                type: 'vector3',
	                value: [2, 2, 0]
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [0, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            },
	            {
	                name: 'texture',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let texture = inputs['texture'];
	        let size = inputs['size'];
	        let position = inputs['position'];
	        let id = inputs['id'] || 'plane';
	        let name = inputs['name'] || 'plane';
	        let color = inputs.color || '#ffffff';
	        let imageTexture = null;
	        let rotation = inputs['rotation'] || [0, 0, 0];
	        let scale = inputs['scale'] || [1, 1, 1];
	        if (texture) {
	            imageTexture = new THING.ImageTexture(texture);
	        }

	        let _object = new THING.Plane(size[0], size[1], {
	            id,
	            name,
	            position,
	            rotation,
	            scale,
	            style: {
	                color,
	                image: imageTexture
	            }
	        });

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }
	}

	class BPCreateLine extends BaseNode3D {
	    static config = {
	        name: 'BPCreateLine',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'id',
	            type: 'string',
	            value: 'line',
	            advanced: true
	        },
	        {
	            name: 'name',
	            type: 'string',
	            value: 'line'
	        },
	        {
	            name: 'type',
	            type: 'select',
	            value: ['PixelLine', 'RouteLine', 'PolygonLine', 'FatLine'],
	        },
	        {
	            name: 'points',
	            type: ['array', 'string'], // 为了连上数组节点的返回值
	        },
	        // {
	        //     name: 'opacity',
	        //     type: 'number',
	        //     value: 1,
	        //     advanced: true
	        // },
	        {
	            name: 'color',
	            type: 'color',
	            value: '#ffffff',
	            advanced: true
	        },
	        {
	            name: 'width',
	            type: 'number',
	            value: 1,
	            advanced: true
	        },
	        {
	            name: 'image',
	            type: 'string',
	            value: '',
	            advanced: true
	        }
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        // let _opacity = inputs['opacity']
	        let _color = inputs['color'] || '#ffffff';
	        let _width = inputs['width'] || 1;
	        let _image = inputs['image'] || '';
	        let id = inputs['id'] || 'line';
	        let name = inputs['name'] || 'line';
	        let _style = {
	            sideType: THING.SideType.Double, // Set to double sided rendering
	            color: _color,
	            // opacity: _opacity || 1
	        };
	        if (_image) {
	            _style.image = new THING.ImageTexture(_image);
	        }

	        let _value = inputs['type'];
	        let _points = inputs['points'];
	        if (typeof _points == 'string') {
	            _points = JSON.parse(_points);
	        }

	        let _object = null;
	        if (_value == 'PixelLine') {
	            _object = new THING.PixelLine({
	                id,
	                name,
	                selfPoints: _points,
	                style: _style,
	                width: _width
	                // complete: async (e)=> {
	                // }
	            });
	        } else if (_value == 'RouteLine') {
	            _object = new THING.RouteLine({
	                id,
	                name,
	                selfPoints: _points,
	                style: _style,
	                width: _width
	                // complete: async (e)=> {
	                // }
	            });
	        } else if (_value == 'PolygonLine') {
	            _object = new THING.PolygonLine({
	                id,
	                name,
	                selfPoints: _points,
	                style: _style,
	                radius: _width
	                // complete: async (e)=> {
	                // }
	            });
	        } else if (_value == 'FatLine') {
	            _object = new THING.FatLine({
	                id,
	                name,
	                selfPoints: _points,
	                style: _style,
	                width: _width
	                // complete: async (e)=> {
	                // }
	            });
	        }

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreatePlaneRegion extends BaseNode3D {
	    static config = {
	        name: 'BPCreatePlaneRegion',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'id',
	            type: 'string',
	            value: 'planeRegion',
	            advanced: true
	        },
	        {
	            name: 'name',
	            type: 'string',
	            value: 'planeRegion'
	        },
	        {
	            name: 'points',
	            type: ['array', 'string'],
	        },
	        {
	            name: 'color',
	            type: 'color',
	            value: '#ffffff',
	            advanced: true
	        },
	        {
	            name: 'position',
	            type: 'vector3',
	            value: [0, 0, 0]
	        }
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用0
	    onExecute(data, inputs, outputs) {
	        const _position = inputs['position'] || [0, 0, 0];
	        let _points = inputs['points'];
	        if (typeof _points == 'string') {
	            _points = JSON.parse(_points);
	        }
	        const _color = inputs['color'];
	        let _name = inputs['name'] || 'planeRegion';
	        let _id = inputs['id'] || 'planeRegion';
	        let params = {
	            id: _id,
	            name: _name,
	            position: _position,
	            style: {
	                color: _color
	            }
	        };
	        if (_points && _points.length) {
	            params.points = _points;
	        }
	        let _object = new THING.PlaneRegion(params);

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateSphere extends BaseNode3D {
	    static config = {
	        name: 'BPCreateSphere',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'id',
	            type: 'string',
	            value: 'sphere',
	            advanced: true
	        },
	        {
	            name: 'name',
	            type: 'string',
	            value: 'sphere',
	        },
	        {
	            name: 'radius',
	            type: 'number',
	            value: 0.5
	        },
	        {
	            name: 'position',
	            type: 'vector3',
	            value: [0, 0, 0]
	        },
	        {
	            name: 'rotation',
	            type: 'vector3',
	            value: [0, 0, 0],
	            advanced: true,
	        },
	        {
	            name: 'scale',
	            type: 'vector3',
	            value: [1, 1, 1],
	            advanced: true
	        },
	        {
	            name: 'widthSegments',
	            type: 'number',
	            value: 16,
	            advanced: true
	        },
	        {
	            name: 'heightSegments',
	            type: 'number',
	            value: 12,
	            advanced: true
	        },
	        {
	            name: 'color',
	            type: 'color',
	            value: '#ffffff',
	            advanced: true
	        },
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _position = inputs.position || [0, 0, 0];
	        let rotation = inputs['rotation'] || [0, 0, 0];
	        let scale = inputs['scale'] || [1, 1, 1];
	        let name = inputs.name || 'sphere';
	        let id = inputs.id || 'sphere';
	        let widthSegments = inputs.widthSegments || 16;
	        let heightSegments = inputs.heightSegments || 12;

	        let radius = inputs['radius'] || 0.5;
	        let _object = new THING.Sphere(radius, {
	            id,
	            name,
	            position: _position,
	            rotation,
	            scale,
	            widthSegments,
	            heightSegments,
	            style: { color: inputs['color'] },
	        });
	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }


	}

	class BPCreateParticleSystem extends BaseNode3D {
	    static config = {
	        name: 'BPCreateParticleSystem',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'particle',
	                advanced: true,
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'particle'
	            },
	            {
	                name: 'url',
	                type: 'string',
	                value: `${BaseNode3D.BASEURL}model/particles`
	            },
	            {
	                name: 'localPosition',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _name = inputs['name'] || 'particle';
	        let _id = inputs['id'] || 'particle';
	        let _url = inputs['url'] || `${BaseNode3D.BASEURL}model/particles`;

	        const localPosition = inputs['localPosition'] || [0, 0, 0];


	        let _object = new THING.ParticleSystem({
	            id: _id,
	            name: _name,
	            url: _url,
	            position: localPosition,
	            // complete: async (e)=> {
	            // }
	        });

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateCircle extends BaseNode3D {
	    static config = {
	        name: 'BPCreateCircle',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'circle',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'circle'
	            },
	            {
	                name: 'radius',
	                type: 'number',
	                value: 1
	            },
	            {
	                name: 'segments',
	                type: 'number',
	                value: 64
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'rotation',
	                type: 'vector3',
	                value: [-90, 0, 0],
	                advanced: true,
	            },
	            {
	                name: 'scale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },

	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _position = inputs['position'] || [0, 0, 0];
	        let radius = inputs.radius || 1;
	        let name = inputs.name || 'circle';
	        let id = inputs.id || 'circle';
	        let segments = inputs.segments || 64;
	        let color = inputs.color || '#ffffff';
	        let rotation = inputs['rotation'] || [-90, 0, 0];
	        let scale = inputs['scale'] || [1, 1, 1];

	        let _object = new THING.Circle({
	            id,
	            name,
	            radius,
	            position: _position,
	            segments,
	            style: { color },
	            rotation,
	            scale,

	        });
	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreatePoints extends BaseNode3D {
	    static config = {
	        name: 'BPCreatePoints',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'point',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'point'
	            },
	            {
	                name: 'points',
	                type: ['array', 'string'],
	            },
	            {
	                name: 'size',
	                type: 'number',
	                value: '2',
	                advanced: true
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff',
	                advanced: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();

	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _name = inputs['name'] || 'point';
	        let _id = inputs['id'] || 'point';
	        let _size = inputs['size'] || 2;
	        let _color = inputs['color'] || '#FF0000';
	        let _points = inputs['points'];
	        if (typeof _points == 'string') {
	            _points = JSON.parse(_points);
	        }

	        let _object = new THING.Points({
	            id: _id,
	            name: _name,
	            points: _points,
	            size: _size,
	            style: {
	                color: _color
	            }
	            // complete: async (e)=> {
	            // }
	        });

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }
	}

	class BPCreateAttachedPoint extends BaseNode3D {
	    static config = {
	        name: 'BPCreateAttachedPoint',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'parent',
	                type: 'selector'
	            },
	            {
	                name: 'child',
	                type: 'selector'
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'attachedPoint',
	                type: 'selector',
	            }
	        ],
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {

	        let parent = inputs['parent'][0];
	        let child = inputs['child'][0];
	        const position = inputs['position'] || [0, 0, 0];
	        let _object = new THING.AttachedPoint({
	            parent,
	            position
	        });
	        _object.add(child);
	        outputs['attachedPoint'] = _object;
	        this._objects.push(_object);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._objects.length > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateExtrudeShape extends BaseNode3D {
	    static config = {
	        name: 'BPCreateExtrudeShape',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'extrudeShape',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'extrudeShape'
	            },
	            {
	                name: 'points',
	                type: ['array', 'string'],
	            },
	            {
	                name: 'hole',
	                type: 'array',
	            },
	            {
	                name: 'height',
	                type: 'number',
	                value: 0
	            },
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            }
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let name = inputs['name'] || 'ExtrudeShape';
	        let id = inputs['id'] || 'ExtrudeShape';
	        let position = inputs['position'] || [0, 0, 0];
	        let hole = inputs['hole'];
	        let height = inputs['height'];
	        let points = inputs['points'];
	        if (typeof points == 'string') {
	            points = JSON.parse(points);
	        }
	        let _object = new THING.ExtrudeShape({
	            name: name,
	            id: id,
	            position: position,
	            selfPlaneHoles: hole,
	            selfPlanePoints: points,
	            height: height,
	        });

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCreateCubeTexture extends BaseNode3D {
	    static config = {
	        name: 'BPCreateCubeTexture',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'urlContents',
	            type: 'string',
	            value: `${BaseNode3D.BASEURL}image/skyboxes/blue/`
	        },
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let urlContents = inputs['urlContents'];

	        let _object = new THING.CubeTexture({
	            url: urlContents
	        });

	        this._objects.push(_object);
	        outputs['object'] = this.toSelector(_object);
	        this.run('complete', outputs);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.clear();
	            this._objects.destroy();
	        }
	    }

	}

	class BPCreateWater extends BaseNode3D {
	    static config = {
	        name: 'BPCreateWater',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'water',
	                advanced: true
	                // visiblePin: false
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'water'
	            },
	            {
	                name: 'point',
	                type: 'array',
	            },
	            {
	                name: 'flowSpeedX',
	                type: 'number',
	                advanced: true,
	                value: 1
	            },
	            {
	                name: 'flowSpeedY',
	                type: 'number',
	                advanced: true,
	                value: 1
	            },
	            {
	                name: 'flowWeight',
	                type: 'number',
	                advanced: true,
	                value: 0.5
	            },
	            {
	                name: 'noiseTimeScale',
	                type: 'number',
	                advanced: true,
	                value: 0.9
	            },
	            {
	                name: 'envMap',
	                type: 'selector',
	                advanced: true
	            }

	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector'
	            }

	        ]
	    }

	    constructor() {
	        super();
	        this._objects = new THING.Selector();

	    }
	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let flowSpeedX = inputs['flowSpeedX'] || 1;
	        let flowSpeedY = inputs['flowSpeedY'] || 1;
	        let flowWeight = inputs['flowWeight'] || 0.5;
	        let noiseTimeScale = inputs['noiseTimeScale'] || 0.9;
	        let point = inputs['point'] || [[-10, 0, -10], [10, 0, -10], [10, 0, 10], [-10, 0, 10]];
	        // let waterID = inputs['id'] || 'water'
	        let id = inputs['id'] || 'water';
	        let envMapObj = inputs['envMap'];
	        // 创建水面
	        // let id = 'uino-water-' + waterID
	        let name = inputs['name'];
	        let water;
	        // if (!this.app.query(`[uuid=${id}]`)._objects.length) {
	        water = new THING.Water({
	            id,
	            name,
	            points: point,
	        });
	        // } else {
	        // water = this.app.query(`[uuid=${id}]`)._objects[0]
	        // }
	        water.flowSpeed = [flowSpeedX, flowSpeedY];
	        water.flowWeight = flowWeight;
	        water.noiseTimeScale = noiseTimeScale;
	        water.style.roughness = 0.2;
	        if (envMapObj && envMapObj.isSelector && envMapObj.length > 0) {
	            water.style.imageSlotType = THING.ImageSlotType.EnvMap;
	            water.style.envMap = envMapObj.objects[0];
	        }
	        this._objects.push(water);
	        outputs['object'] = this.toSelector(water);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const len = this._objects.length;
	        if (len && len > 0) {
	            this._objects.destroy();
	            this._objects.clear();
	        }
	    }

	}

	class BPCameraFlyTo extends BaseNode3D {
	  static config = {
	    name: 'BPCameraFlyTo',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    }, {
	      name: 'camera',
	      type: 'selector'
	    },
	    {
	      name: 'position',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'target',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    },
	    {
	      name: 'time',
	      type: 'number',
	      value: 1
	    },
	    {
	      name: 'delayTime',
	      type: 'number',
	      value: 0,
	      advanced: true,

	    }
	    ],
	    outputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'complete',
	      type: 'callback',
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {

	    let _object = inputs['object'] || new THING.Selector();
	    let _target = inputs['target'];
	    let position = inputs['position'] || [0, 0, 0];
	    let time = handleTime(inputs['time']);
	    let delayTime = inputs['delayTime'] * 1000 || 0;
	    let app = this.app;
	    this._camera = inputs['camera'];
	    if (this._camera && this._camera.isSelector && this._camera.length > 0) {
	      this._camera = this._camera[0];
	    } else {
	      this._camera = app.camera;
	      this.position = app.camera.position;
	      this.target = app.camera.target;
	    }
	    let that = this;
	    outputs['object'] = _object;
	    let cameraTarget;
	    if (_object && _object.isSelector && _object.length > 0) {
	      cameraTarget = _object[0];
	    } else if (_target && _target.length > 0) {
	      cameraTarget = _target;
	    } else {
	      cameraTarget = [0, 0, 0];
	    }
	    this._camera.flyTo({
	      target: cameraTarget,
	      position: position,
	      time: time,
	      delayTime: delayTime,
	      complete: () => {
	        that.run('complete', outputs);
	      }
	    });

	    function handleTime(time) {
	      let reg = /^\d+(\.\d+)?$/;
	      if (reg.test(time)) {
	        return time * 1000;
	      } else {
	        return 0;
	      }
	    }
	  }
	  onStop() {
	    this._camera && this._camera.stopFlying();
	    if (this.position && this.target) {
	      this.app.camera.position = this.position;
	      this.app.camera.target = this.target;
	    }
	  }
	}

	class BPCameraStopFlying extends BaseNode3D {
	  static config = {
	    name: 'BPCameraStopFlying',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    }
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = this.app.camera;
	    }
	    _camera.stopFlying();
	  }
	}

	class BPCameraFit extends BaseNode3D {
	  static config = {
	    name: 'BPCameraFit',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    },
	    {
	      name: 'target',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    },
	    ],
	    outputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'object',
	      type: 'selector'
	    }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _object = inputs['object'] || new THING.Selector();
	    const _target = inputs['target'] || [0, 0, 0];
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = this.app.camera;
	    }

	    if (_object && _object.isSelector && _object.length > 0) {
	      _camera.fit(_object[0]);
	    } else if (_target && _target.length > 0) {
	      _camera.fit(_target);
	    } else {
	      _camera.fit([0, 0, 0]);
	    }
	    outputs['object'] = _object;
	    // if (!_target) {
	    //   _camera.fit([0, 0, 0]);
	    // }
	    // else if (_target.isSelector) {
	    //   _camera.fit(_target[0]);
	    // } else if (_target instanceof Array) {
	    //   _camera.fit(_target);
	    // } else if (typeof _target === 'string') {
	    //   try {
	    //     _camera.fit(JSON.parse(_target));
	    //   } catch (error) {
	    //     console.log(error)
	    //   }
	    // }
	  }
	}

	class BPCameraFollow extends BaseNode3D {
	  static config = {
	    name: 'BPCameraFollow',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    },
	    {
	      name: 'target',
	      type: 'selector',
	    },
	    {
	      name: 'offsetPosition',
	      type: 'vector3',
	      value: [0, 5, -10]
	    },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      }
	    ]
	  }
	  constructor() {
	    super();
	    this._target = null;
	  }
	  onExecute(data, inputs, outputs) {
	    const _target = inputs['target'];
	    if (_target && _target.isSelector && _target.length > 0) {
	      this._target = _target[0];
	    } else {
	      return;
	    }

	    const _offsetPosition = inputs['offsetPosition'] || [0, 5, -10];
	    let app = this.app;
	    this._camera = inputs['camera'];
	    if (this._camera && this._camera.isSelector && this._camera.length > 0) {
	      this._camera = this._camera[0];
	    } else {
	      this._camera = app.camera;
	    }
	    this._camera.off('update', null, '自定义摄像机跟随');
	    this._camera.on('update', () => {
	      const _targetPosition = this._target.position;
	      this._camera.position = this._target.selfToWorld(_offsetPosition);
	      this._camera.target = _targetPosition;
	    }, '自定义摄像机跟随');
	    outputs['object'] = _target;
	  }
	  onStop() {
	    this._camera.off('update', null, '自定义摄像机跟随');
	  }
	}

	class BPCameraSetProjection extends BaseNode3D {
	    static config = {
	        name: 'BPCameraSetProjection',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'camera',
	                type: 'selector'
	            },
	            {
	                name: 'mode',
	                type: 'select',
	                value: ['Orthographic', 'Perspective'],
	            },
	            {
	                name: 'time',
	                type: 'number',
	                value: 1,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ]
	    }

	    onExecute(data, inputs, outputs) {
	        let _mode = inputs['mode'] || 'Orthographic';
	        let _time = handleTime(inputs['time']);
	        let projectionType = _mode === 'Orthographic' ? THING.ProjectionType['Orthographic'] : THING.ProjectionType['Perspective'];
	        let _camera = inputs['camera'];
	        if (_camera && _camera.isSelector && _camera.length > 0) {
	            _camera = _camera[0];
	        } else {
	            _camera = this.app.camera;
	        }
	        _camera.setProjectionType(projectionType, _time);
	        function handleTime(time) {
	            let reg = /^\d+(\.\d+)?$/;
	            if (reg.test(time)) {
	                return time * 1000;
	            } else {
	                return 0;
	            }
	        }
	    }

	}

	class BPCameraSetFog extends BaseNode3D {
	  static config = {
	    name: 'BPCameraSetFog',
	    group: 'Custom',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'enable',
	        type: 'boolean',
	        value: true,
	        // visiblePin: false
	      },
	      {
	        name: 'far',
	        type: 'number',
	        value: 300
	      },
	      {
	        name: 'color',
	        type: 'color',
	        value: '#ffffff',
	        advanced: true
	      }
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },

	    ],
	  }
	  constructor() {
	    super();
	    this._fog = null;
	  }
	  onExecute(data, inputs, outputs) {
	    let _enable = inputs['enable'];
	    let _far = inputs['far'];
	    let _color = inputs['color'];
	    let fog = this.app.camera.fog;
	    this._fog = {
	      far: fog.far,
	      color: fog.color
	    };

	    fog.enable = _enable;

	    if (_enable) {
	      fog.far = _far;
	      fog.color = _color;
	    }
	  }
	  onStop() {
	    this.app.camera.fog.far = this._fog.far;
	    this.app.camera.fog.color = this._fog.color;
	  }
	}

	class BPCameraSetFov extends BaseNode3D {
	    static config = {
	        name: 'BPCameraSetFov',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'fov',
	                type: 'number',
	                value: 50
	            }

	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            }
	        ]
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        this.oldFov = this.app.camera.fov;
	        let fov = inputs['fov'];
	        this.app.camera.fov = fov;
	    }

	    onStop() {
	        if (this.oldFov) {
	            this.app.camera.fov = this.oldFov;
	        }
	    }

	}

	class BPCameraSetPosition extends BaseNode3D {
	  static config = {
	    name: 'BPCameraSetPosition',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    },
	    {
	      name: 'position',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'target',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _position = inputs['position'] || [0, 0, 0];
	    let _target = inputs['target'] || [0, 0, 0];
	    let app = this.app;
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = app.camera;
	      this.position = app.camera.position;
	      this.target = app.camera.target;
	    }
	    //获取当前摄像机位置
	    _camera.position = _position;
	    _camera.target = _target;
	  }
	  onStop() {
	    if (this.position && this.target) {
	      this.app.camera.position = this.position;
	      this.app.camera.target = this.target;
	    }

	  }
	}

	class BPCameraGetPosition extends BaseNode3D {
	  static config = {
	    name: 'BPCameraGetPosition',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    }
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'position',
	        type: 'vector3',
	      },
	      {
	        name: 'target',
	        type: 'vector3',
	      },
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = this.app.camera;
	    }
	    outputs['position'] = _camera.position;
	    outputs['target'] = _camera.target;
	  }
	}

	class BPCameraStopFollowing extends BaseNode3D {
	  static config = {
	    name: 'BPCameraStopFollowing',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    }
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },

	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let app = this.app;
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = app.camera;
	    }
	    _camera.off('update', null, '自定义摄像机跟随');
	  }
	}

	class BPCameraSetViewMode extends BaseNode3D {
		static config = {
			name: 'BPCameraSetViewMode',
			inputs: [
				{
					name: 'exec',
					type: 'exec',
				},
				{
					name: 'type',
					type: 'select',
					value: ['None', 'Top', 'Bottom', 'Left', 'Right', 'Front', 'Back']
				}
			],
			outputs: [
				{
					name: 'exec',
					type: 'exec'
				}
			]
		};

		constructor() {
			super();
			this.index = 0;
		}

		onExecute(data, inputs, outputs) {
			let _type = inputs['type'];
			if (_type == 'None') {
				this.app.camera.viewModeType = null;
			} else {
				this.app.camera.viewModeType = _type;
			}

		}
		onStop() {
			this.app.camera.viewModeType = null;
		}

	}

	class BPAddCamera extends BaseNode3D {
	  static config = {
	    name: 'BPAddCamera',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'position',
	        type: 'vector3',
	        value: [0, 0, 0]
	      },
	      {
	        name: 'target',
	        type: 'vector3',
	        value: [0, 0, 0]
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	      {
	        name: 'viewType',
	        type: 'select',
	        value: ['固定视角', '第一人称视角', '第三人称视角'],
	        advanced: true
	      },
	      {
	        name: 'top',
	        type: 'number',
	        value: 10,
	        advanced: true
	      },
	      {
	        name: 'right',
	        type: 'number',
	        value: 10,
	        advanced: true
	      },
	      {
	        name: 'width',
	        type: 'number',
	        value: 200,
	        advanced: true
	      },
	      {
	        name: 'height',
	        type: 'number',
	        value: 200,
	        advanced: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'object',
	        type: 'selector',
	      },
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _position = inputs['position'] || [0, 0, 0];
	    let _target = inputs['target'] || [0, 0, 0];
	    let _viewType = inputs['viewType'] || '固定视角';
	    let _object = inputs['object'];
	    let _top = inputs['top'] || 10;
	    let _right = inputs['right'] || 10;
	    let _width = inputs['width'] || 200;
	    let _height = inputs['height'] || 200;
	    let app = this.app;

	    if (!this._camera) {
	      this._camera = new THING.Camera();
	    }

	    this._camera.name = 'ffff';
	    this._camera.enableViewport = true;
	    this._camera.viewport = [app.size[0] - _width - _right, _top, _width, _height];
	    this._camera.enable = false;
	    switch (_viewType) {
	      case '固定视角':
	        this._camera.position = _position;
	        this._camera.target = _target;
	        break;
	      case '第一人称视角':
	        if (_object && _object.isSelector && _object.length > 0) {
	          let that = this;
	          this._camera.on('update', function () {
	            that._camera.position = THING.Math.addVector(THING.Math.addVector([_object[0].position[0], _object[0].position[1] + _object[0].boundingBox.size[1], _object[0].position[2]], _object[0].forward), _position);
	            that._camera.target = THING.Math.addVector(that._camera.position, _object[0].forward);
	          });
	        } else {
	          console.error('未传入第一人称对象');
	        }
	        break;
	      case '第三人称视角':
	        if (_object && _object.isSelector && _object.length > 0) {
	          let that = this;
	          this._camera.on('update', function () {
	            that._camera.position = THING.Math.addVector([_object[0].position[0], _object[0].position[1], _object[0].position[2]], _position);
	            that._camera.target = _object[0].position;
	          });
	        } else {
	          console.error('未传入第三人称对象');
	        }
	        break;
	    }
	    let cameraSelector = new THING.Selector();
	    cameraSelector.push(this._camera);
	    outputs['object'] = cameraSelector;
	  }
	  onStop() {
	    if (this._camera) {
	      this._camera.destroy();
	    }
	  }
	}

	class BPCameraRotateAround extends BaseNode3D {
	  static config = {
	    name: 'BPCameraRotateAround',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'camera',
	      type: 'selector'
	    },
	    {
	      name: 'target',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'object',
	      type: 'selector'
	    },
	    {
	      name: 'time',
	      type: 'number',
	      value: 1
	    },
	    {
	      name: 'XAngle',
	      type: 'number',
	      value: 0
	    },
	    {
	      name: 'YAngle',
	      type: 'number',
	      value: 0
	    },
	    {
	      name: 'loopType',
	      type: 'select',
	      value: ['Once', 'Repeat', 'PingPong'],
	      advanced: true,
	    }
	    ],
	    outputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'complete',
	      type: 'callback'
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _object = inputs['object'] || new THING.Selector();
	    let _target = inputs['target'] || [0, 0, 0];
	    let cameraTarget;
	    if (_object && _object.isSelector && _object.length > 0) {
	      cameraTarget = _object[0];
	    } else if (_target && _target.length > 0) {
	      cameraTarget = _target;
	    }
	    let _time = handleTime(inputs['time']);
	    let _XAngle = inputs['XAngle'] || 0;
	    let _YAngle = inputs['YAngle'] || 0;
	    let _loopType = inputs['loopType'] || 'Once';
	    _loopType = THING.LoopType[_loopType];
	    let app = this.app;
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      this.camera = _camera[0];
	    } else {
	      this.camera = app.camera;
	    }
	    let that = this;
	    let rotateAround = new THING.EXTEND.RotateAroundComponent();
	    this.camera.addComponent(rotateAround, 'rotateAround');
	    this.camera.rotateAround.start({
	      target: cameraTarget,
	      time: _time,
	      xRotateAngle: _XAngle,
	      yRotateAngle: _YAngle,
	      loopType: _loopType,
	      complete: () => {
	        this.run('complete', outputs);
	      },
	      update: () => {
	        that.camera.lookAt(_target);
	      }
	    });
	    outputs['object'] = _object;

	    function handleTime(time) {
	      let reg = /^\d+(\.\d+)?$/;
	      if (reg.test(time)) {
	        return time * 1000;
	      } else {
	        return 0;
	      }
	    }
	  }

	  onStop() {
	    let app = this.app;
	    if (this.camera && app.camera.rotateAround) {
	      app.camera.rotateAround.stop();
	      app.camera.removeComponent('rotateAround');
	    }

	  }
	}

	class BPCameraStopRotating extends BaseNode3D {
	  static config = {
	    name: 'BPCameraStopRotating',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'camera',
	        type: 'selector'
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {

	    let app = this.app;
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = app.camera;
	    }
	    let rotateAround = _camera.getComponentByName('rotateAround');
	    if (rotateAround) {
	      rotateAround.stop();
	    }
	  }
	}

	class BPCameraPanControl extends BaseNode3D {
	  static config = {
	    name: 'BPCameraPanControl',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'camera',
	        type: 'selector'
	      },
	      {
	        name: 'x',
	        type: 'number',
	        value: 0
	      },
	      {
	        name: 'y',
	        type: 'number',
	        value: 0
	      },
	      {
	        name: 'time',
	        type: 'number',
	        value: 0.5,
	        advanced: true,
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let x = inputs['x'] || 0;
	    let y = inputs['y'] || 0;
	    let _time = handleTime(inputs['time']);
	    let app = this.app;
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = app.camera;
	    }
	    _camera.pan(x, y, _time);

	    function handleTime(time) {
	      let reg = /^\d+(\.\d+)?$/;
	      if (reg.test(time)) {
	        return time * 1000;
	      } else {
	        return 0;
	      }
	    }
	  }
	}

	class BPCameraZoomControl extends BaseNode3D {
	  static config = {
	    name: 'BPCameraZoomControl',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'camera',
	        type: 'selector'
	      },
	      {
	        name: 'distance',
	        type: 'number',
	        value: 0
	      },
	      {
	        name: 'time',
	        type: 'number',
	        value: 0.5,
	        advanced: true,
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _distance = inputs['distance'] || 0;
	    let _time = handleTime(inputs['time']);
	    let app = this.app;
	    let _camera = inputs['camera'];
	    if (_camera && _camera.isSelector && _camera.length > 0) {
	      _camera = _camera[0];
	    } else {
	      _camera = app.camera;
	    }
	    _camera.zoom(_distance, { time: _time });

	    function handleTime(time) {
	      let reg = /^\d+(\.\d+)?$/;
	      if (reg.test(time)) {
	        return time * 1000;
	      } else {
	        return 0;
	      }
	    }
	  }
	}

	class BPCameraEnablePan extends BaseNode3D {
	  static config = {
	    name: 'BPCameraEnablePan',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'enablePan',
	        type: 'boolean',
	        value: true,
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _enable = inputs['enablePan'] || false;
	    this.app.camera.enablePan = _enable;
	  }

	  onStop() {
	    this.app.camera.enablePan = true;
	  }
	}

	class BPCameraEnableRotate extends BaseNode3D {
	  static config = {
	    name: 'BPCameraEnableRotate',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'enableRotate',
	        type: 'boolean',
	        value: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _enable = inputs['enableRotate'] || false;
	    this.app.camera.enableRotate = _enable;
	  }

	  onStop() {
	    this.app.camera.enableRotate = true;
	  }
	}

	class BPCameraEnableZoom extends BaseNode3D {
	  static config = {
	    name: 'BPCameraEnableZoom',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'enableZoom',
	        type: 'boolean',
	        value: true,
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _enable = inputs['enableZoom'] || false;
	    this.app.camera.enableZoom = _enable;
	  }

	  onStop() {
	    this.app.camera.enableZoom = true;
	  }
	}

	class BPCameraSetVertAngleLimit extends BaseNode3D {
	  static config = {
	    name: 'BPCameraSetVertAngleLimit',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'angleLimit',
	        type: 'vector2',
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _angleLimit = inputs['angleLimit'] || [0, 0];
	    this.app.camera.vertAngleLimit = _angleLimit;
	  }

	  onStop() {
	    this.app.camera.vertAngleLimit = [0, 180];
	  }
	}

	class BPCameraSetHorzAngleLimit extends BaseNode3D {
	  static config = {
	    name: 'BPCameraSetHorzAngleLimit',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'angleLimit',
	        type: 'vector2',
	      },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _angleLimit = inputs['angleLimit'] || [0, 0];
	    this.app.camera.horzAngleLimit = _angleLimit;
	  }

	  onStop() {
	    this.app.camera.horzAngleLimit = [-360, 360];
	  }
	}

	class BPBindMouseClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindMouseClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'type',
	                type: 'select',
	                value: ['left', 'middle', 'right'],
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],

	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'clickObject',
	                type: 'selector',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	                advanced: true
	            },
	        ],
	    }

	    constructor() {
	        super();
	        this._object = new THING.Selector();
	        this._clickobject = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let that = this;
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        this._object = inputs.object || this.app;
	        this._event = 'click';
	        if ((inputs.type instanceof Array) || !inputs.type) {
	            this.button = 'left';
	        } else {
	            this.button = inputs.type;
	        }

	        let buttonTypes = {
	            'left': 0,
	            'middle': 1,
	            'right': 2
	        };
	        this._object.on(this._event, (ev) => {
	            bundleClick(ev);
	        }, this._tag);

	        function bundleClick(ev) {
	            if (buttonTypes[that.button] !== ev.button) return;
	            that._clickobject.clear();
	            that._clickobject.push(ev.object);
	            outputs['clickObject'] = that._clickobject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            that.run('callback', outputs);
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object == this.app) {
	            this._object.off(this._event, this._tag);
	            this._clickobject.clear();
	        }
	    }
	}

	class BPUnbindMouseClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindMouseClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._object = inputs.object || this.app;
	        this._event = 'click';

	        this._object.off(this._event, this._tag);
	        outputs['object'] = this._object;
	    }
	}

	class BPPauseMouseClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseMouseClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        this._event = 'click';
	        this._tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        this._object = inputs['object'] || this.app;

	        if (!this._object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        if (_pause) {
	            this._object.pauseEvent(this._event, null, this._tag);
	        } else {
	            this._object.resumeEvent(this._event, null, this._tag);
	        }

	        outputs['object'] = this._object;
	    }

	    onStop() {
	        // this._object && this._object.resumeEvent(this._event, null, this._tag)
	    }
	}

	class BPBindMouseEnterEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindMouseEnterEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'moveObject',
	                type: 'selector',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	                advanced: true
	            },

	        ],
	    }

	    constructor() {
	        super();
	        this._object = new THING.Selector();
	        this._enterObject = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        this._object = inputs.object || this.app;
	        this._event = 'mouseenter';
	        let that = this;

	        this._object.on(this._event, (ev) => {
	            that._enterObject.clear();
	            that._enterObject.push(ev.object);
	            outputs['moveObject'] = that._enterObject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            this.run('callback', outputs);
	        }, this._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object == this.app) {
	            this._object.off(this._event, this._tag);
	            this._enterObject.clear();
	        }
	    }
	}

	class BPUnbindMouseEnterEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindMouseEnterEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._object = inputs.object || this.app;
	        this._event = 'mouseenter';

	        this._object.off(this._event, this._tag);
	        outputs['object'] = this._object;
	    }
	}

	class BPBindMouseLeaveEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindMouseLeaveEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'moveObject',
	                type: 'selector',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	                advanced: true
	            },

	        ],
	    }

	    constructor() {
	        super();
	        this._object = new THING.Selector();
	        this._enterObject = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        this._object = inputs.object || this.app;
	        this._event = 'mouseleave';
	        let that = this;

	        this._object.on(this._event, (ev) => {
	            that._enterObject.clear();
	            that._enterObject.push(ev.object);
	            outputs['moveObject'] = that._enterObject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            this.run('callback', outputs);
	        }, this._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object == this.app) {
	            this._object.off(this._event, this._tag);
	            this._enterObject.clear();
	        }
	    }
	}

	class BPUnbindMouseLeaveEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindMouseLeaveEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._object = inputs.object || this.app;
	        this._event = 'mouseleave';

	        this._object.off(this._event, this._tag);
	        outputs['object'] = this._object;
	    }
	}

	class BPBindMouseDoubleClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindMouseDoubleClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'type',
	                type: 'select',
	                value: ['left', 'middle', 'right'],
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	                advanced: true
	            },
	            {
	                name: 'dblClickObject',
	                type: 'selector',
	            },


	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	        this._dblClickObject = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let that = this;
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        this._object = inputs.object || this.app;
	        this._event = 'dblclick';
	        if ((inputs.type instanceof Array) || !inputs.type) {
	            this.button = 'left';
	        } else {
	            this.button = inputs.type;
	        }
	        let buttonTypes = {
	            'left': 0,
	            'middle': 1,
	            'right': 2
	        };

	        this._object.on(this._event, (ev) => {
	            bundleClick(ev);
	        }, this._tag);

	        function bundleClick(ev) {
	            if (buttonTypes[that.button] !== ev.button) return;
	            that._dblClickObject.clear();
	            that._dblClickObject.push(ev.object);
	            outputs['dblClickObject'] = that._dblClickObject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            that.run('callback', outputs);
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object == this.app) {
	            this._object.off(this._event, this._tag);
	            this._dblClickObject.clear();
	        }
	    }
	}

	class BPUnbindMouseDoubleClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindMouseDoubleClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._object = inputs.object || this.app;
	        this._event = 'dblclick';

	        this._object.off(this._event, this._tag);
	        outputs['object'] = this._object;
	    }
	}

	class BPPauseMouseDoubleClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseMouseDoubleClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _event = 'dblclick';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        let _object = inputs['object'] || this.app;

	        if (!_object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        if (_pause) {
	            _object.pauseEvent(_event, null, _tag);
	        } else {
	            _object.resumeEvent(_event, null, _tag);
	        }

	        outputs['object'] = _object;
	    }
	}

	class BPBindMouseMoveEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindMouseMoveEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	                advanced: true
	            },
	            {
	                name: 'moveObject',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();
	        this._object = new THING.Selector();
	        this._moveObject = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        this._object = inputs.object || this.app;
	        this._event = 'mousemove';
	        let that = this;

	        this._object.on(this._event, (ev) => {
	            that._moveObject.clear();
	            that._moveObject.push(ev.object);
	            outputs['moveObject'] = that._moveObject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            this.run('callback', outputs);
	        }, this._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object == this.app) {
	            this._object.off(this._event, this._tag);
	            this._moveObject.clear();
	        }
	    }
	}

	class BPUnbindMouseMoveEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindMouseMoveEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._object = inputs.object || this.app;
	        this._event = 'mousemove';

	        this._object.off(this._event, this._tag);
	        outputs['object'] = this._object;
	    }
	}

	class BPPauseMouseMoveEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseMouseMoveEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _event = 'mousemove';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        let _object = inputs['object'] || this.app;

	        if (!_object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        if (_pause) {
	            _object.pauseEvent(_event, null, _tag);
	        } else {
	            _object.resumeEvent(_event, null, _tag);
	        }

	        outputs['object'] = _object;
	    }
	}

	class BPBindObjectUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindObjectUpdateEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        },
	        {
	            name: 'tag',
	            type: 'string',
	            advanced: true
	        },
	        ],
	        outputs: [{
	            name: 'callback',
	            type: 'callback',
	        },
	        {
	            name: 'object',
	            type: 'selector',
	        }

	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        // this._object = inputs['object'] || THING.App.current
	        this._object = inputs['object'] || new THING.Selector();

	        // if (!this._object) {
	        //     console.error('没有找到绑定事件的对象')
	        //     return
	        // }

	        let that = this;
	        if (this._object.isSelector && this._object.length > 0) {
	            let eventObject = new THING.Selector();
	            this._object.on('update', function (ev) {
	                eventObject.clear();
	                eventObject.push(ev.object);
	                outputs['object'] = eventObject;
	                that.run('callback', outputs);
	            }, that._tag);
	        } else {
	            outputs['object'] = this._object;
	        }
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this._object.off('update', this._tag);
	    }

	}

	class BPBindUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindUpdateEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'tag',
	            type: 'string',
	            advanced: true
	        },
	        ],
	        outputs: [{
	            name: 'callback',
	            type: 'callback',
	        },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._tag = inputs['tag'] || defaultTag;
	        // this._object = inputs['object'] || THING.App.current

	        // if (!this._object) {
	        //     console.error('没有找到绑定事件的对象')
	        //     return
	        // }

	        let that = this;
	        this.app.on('update', function (ev) {
	            that.run('callback', outputs);
	        }, that._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this.app.off('update', this._tag);
	    }

	}

	class BPUnbindObjectUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindObjectUpdateEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _event = 'update';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _object = inputs['object'] || new THING.Selector();

	        if (_object.isSelector && _object.length > 0) {
	            _object.off(_event, _tag);
	            // return
	        }
	        outputs['object'] = _object;
	    }

	}

	class BPUnbindUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindUpdateEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'tag',
	            type: 'string',
	            advanced: true
	        },
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec',
	        },],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _event = 'update';
	        let _tag = inputs['tag'] || 'defaultTag';
	        this.app.off(_event, _tag);
	    }

	}

	class BPPauseObjectUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseObjectUpdateEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _event = 'update';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        let _object = inputs['object'] || new THING.Selector();

	        if (_object.isSelector && _object.length > 0) {
	            if (_pause) {
	                _object.pauseEvent(_event, null, _tag);
	            } else {
	                _object.resumeEvent(_event, null, _tag);
	            }
	        }
	        outputs['object'] = _object;
	    }
	}

	class BPPauseUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseUpdateEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'tag',
	            type: 'string',
	            advanced: true
	        },
	        {
	            name: 'pause',
	            type: 'boolean',
	            value: true,
	        },
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _event = 'update';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        let _app = this.app;

	        if (_pause) {
	            _app.pauseEvent(_event, null, _tag);
	        } else {
	            _app.resumeEvent(_event, null, _tag);
	        }
	    }
	}

	class BPBindKeyboardEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindKeyboardEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['keydown', 'keypress', 'keyup']
	            },
	            {
	                name: 'keyCode',
	                type: 'string',
	                desc: '默认监听键盘的所有键，如果想监听某一个键，如：键A，则输入keyA'
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'keyCode',
	                type: 'number',
	            },

	        ],
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._event = inputs['event'] || 'keydown';
	        this._tag = inputs['tag'] || defaultTag;
	        this._keyCode = inputs['keyCode'] || 'allKeyCode';
	        this._app = this.app;
	        //不是数字
	        if (isNaN(this._keyCode)) {
	            this._keyCode = strToCode(this._keyCode);
	        }

	        let eventObject = new THING.Selector();
	        this._app.on(this._event, (ev) => {
	            if (this._keyCode == ev.keyCode || this._keyCode == ev.code || this._keyCode == 'allKeyCode') {
	                eventObject.clear();
	                eventObject.push(ev.object);
	                outputs['keyCode'] = ev.keyCode;
	                outputs['object'] = eventObject;
	                this.run('callback', outputs);
	            }

	        }, this._tag);
	        function strToCode(keyText) {
	            let keyCode = keyText;
	            if (keyText.length == 1) {
	                keyText = keyText.toLocaleLowerCase();
	                keyCode = keyText.charCodeAt(0);
	            }
	            return keyCode
	        }
	    }
	    // 当蓝图停止时被调用
	    onStop() {
	        this._app.off(this._event, this._tag);
	    }

	}

	class BPUnbindKeyboardEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindKeyboardEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['keydown', 'keypress', 'keyup']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            }
	        ],
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._event = inputs['event'] || 'keydown';
	        this._tag = inputs['tag'] || 'defaultTag';
	        this.app.off(this._event, this._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	    }

	}

	class BPPauseKeyboardEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseKeyboardEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['keydown', 'keypress', 'keyup']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _event = inputs['event'] || 'keydown';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        let _app = this.app;

	        if (_pause) {
	            _app.pauseEvent(_event, null, _tag);
	        } else {
	            _app.resumeEvent(_event, null, _tag);
	        }

	    }
	}

	/**
	 * @description 【蓝图节点 - 事件】 鼠标拖拽
	 * @author 林嘉禾
	 * @date Feb-06, 2023, 10:17:00
	 * @lastModifiedBy 林嘉禾
	 * @lastModifiedTime
	 **/

	class BPBindMouseDragEvent extends BaseNode3D {
	    _ctrDraggable
	    static config = {
	        name: 'BPBindMouseDragEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec'
	        },
	        {
	            name: 'object',
	            type: 'selector'
	        }
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec'
	        },
	        {
	            name: 'mouseenter',
	            type: 'callback',
	            advanced: true
	        },
	        {
	            name: 'mouseleave',
	            type: 'callback',
	            advanced: true
	        },
	        {
	            name: 'dragstart',
	            type: 'callback'
	        },
	        {
	            name: 'dragging',
	            type: 'callback'
	        },
	        {
	            name: 'dragend',
	            type: 'callback'
	        },
	        {
	            name: 'coordinates',
	            type: 'array',
	            advanced: true
	        },
	        {
	            name: 'dragObject',
	            type: 'selector',
	        },
	        ]
	    }

	    constructor() {
	        super();
	        this._dragobject = new THING.Selector();
	    }

	    onExecute(data, inputs, outputs) {
	        const _objCtr = inputs['object'] || new THING.Selector();
	        this._ctrDraggable = [];

	        if (_objCtr.isSelector) {
	            const len = _objCtr.length;

	            if (len > 0) {
	                if (len === 1) {
	                    const obj = _objCtr[0];

	                    this.handleDragComponent(obj);
	                    this.handleDraggableHighlight(obj, outputs);
	                } else {
	                    for (let i = 0; i < len; i++) {
	                        const obj = _objCtr[i];

	                        this.handleDragComponent(obj);
	                        this.handleDraggableHighlight(obj, outputs);
	                    }
	                }
	            }
	        }
	    }

	    /**
	     * @description 添加拖拽组件，先判断组件是否已经存在
	     */
	    handleDragComponent(obj) {
	        try {
	            if (!obj.drag) {
	                obj.addComponent(THING.EXTEND.DragComponent, 'drag');
	            }

	            obj.drag.enable = true;

	            this._ctrDraggable.push(obj);
	        } catch (error) {
	            console.log(error);
	        }
	    }

	    /**
	     * @description 给可拖拽的物体添加默认的提示样式，事件命名规范：节点名 + 事件名
	     */
	    handleDraggableHighlight(obj, outputs) {
	        obj.on('dragstart', (ev) => {
	            obj.style.opacity = 0.3;
	            this._dragobject.clear();
	            this._dragobject.push(ev.object);
	            outputs.coordinates = [ev.clientX, ev.clientY];
	            outputs.dragObject = this._dragobject;
	            this.run('dragstart', outputs);
	        }, 'eventMouseDragDragStart');

	        obj.on('dragging', (ev) => {
	            this._dragobject.clear();
	            this._dragobject.push(ev.object);
	            outputs.coordinates = [ev.clientX, ev.clientY];
	            outputs.dragObject = this._dragobject;
	            this.run('dragging', outputs);
	        }, 'eventMouseDragDragStart');

	        obj.on('dragend', (ev) => {
	            obj.style.opacity = 1;
	            obj.style.outlineColor = undefined;
	            this._dragobject.clear();
	            this._dragobject.push(ev.object);
	            outputs.coordinates = [ev.clientX, ev.clientY];
	            outputs.dragObject = this._dragobject;
	            this.run('dragend', outputs);
	        }, 'eventMouseDragDragEnd');

	        obj.on('mouseenter', () => {
	            obj.style.outlineColor = '#00ffff';
	            this.run('mouseenter', outputs);
	        }, 'eventMouseDragMouseEnter');

	        obj.on('mouseleave', () => {
	            obj.style.outlineColor = undefined;
	            this.run('mouseleave', outputs);
	        }, 'eventMouseDragMouseLeave');
	    }

	    onStop() {
	        if (this._ctrDraggable.length > 0) {
	            const len = this._ctrDraggable.length;

	            for (let i = 0; i < len; i++) {
	                const obj = this._ctrDraggable[i];

	                if (obj.drag) {
	                    obj.drag.enable = false;
	                    obj.off('dragstart', 'eventMouseDragDragStart');
	                    obj.off('dragend', 'eventMouseDragDragEnd');
	                    obj.off('mouseenter', 'eventMouseDragMouseEnter');
	                    obj.off('mouseLeave', 'eventMouseDragMouseLeave');

	                    obj.removeComponent('drag');
	                }


	            }
	        }
	    }
	}

	class BPBindAppEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindAppEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'name',
	            type: 'string',
	        },
	        ],
	        outputs: [{
	            name: 'callback',
	            type: 'callback',
	        },
	        {
	            name: 'params',
	            type: 'any',
	        },
	        ],
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this.name = inputs['name'];
	        let that = this;
	        this.app.on(this.name, function (ev) {
	            outputs['params'] = ev.param;
	            that.run('callback', outputs);
	        });
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this.app.off(this.name);
	    }

	}

	class BPTriggerAppEvent extends BaseNode3D {
	    static config = {
	        name: 'BPTriggerAppEvent',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'name',
	            type: 'string',
	        },
	        {
	            name: 'param',
	            type: 'any'
	        }
	        ],
	        outputs: [{
	            name: 'next',
	            type: 'exec',
	        },
	        ],
	    }

	    constructor() {
	        super();
	        this._object = null;
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _name = inputs['name'];
	        let param = inputs['param'];
	        this.app.trigger(_name, { param });
	    }
	}

	class BPCreateButton extends BaseNode3D {
	    static config = {
	        name: 'BPCreateButton',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'text',
	                type: 'string',
	                value: '按钮'
	            },
	            {
	                name: 'width',
	                type: 'number',
	                value: 0,
	                advanced: true
	            },
	            {
	                name: 'height',
	                type: 'number',
	                value: 30,
	                advanced: true
	            },
	            {
	                name: 'x',
	                type: 'number',
	                value: 10,
	                advanced: true
	            },
	            {
	                name: 'y',
	                type: 'number',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            }
	            // {
	            //     name: 'interface',
	            //     type: 'object',
	            //     advanced: true
	            // },
	            // {
	            //     name: 'fontText',
	            //     type: 'string',
	            //     advanced: true
	            // }
	        ]
	    }

	    constructor() {
	        super();
	    }
	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        //处理输入参数
	        let {
	            text = '按钮',
	            width = 0,
	            height = 30,
	            x = 10,
	            y,
	        } = inputs;
	        if (isNaN(width)) width = 0;
	        if (isNaN(height)) height = 30;
	        if (isNaN(x)) x = 10;
	        let thingBtnList = document.querySelectorAll('.thingBtn');
	        if (!y) {
	            y = thingBtnList.length * (height + 10) + 10;
	        }
	        let dirX = 'left';
	        let dirY = 'top';
	        if (x < 0) {
	            dirX = 'right';
	            x = -x;
	        }
	        if (y < 0) {
	            dirY = 'bottom';
	            y = -y;
	        }

	        //创建按钮dom
	        let oDiv3dBox = document.querySelector("#div3d").parentNode;

	        oDiv3dBox.style.position = 'relative';
	        function createDocument(template, className) {
	            let doc = new DOMParser().parseFromString(template, 'text/html');
	            let domObject = doc.querySelector(`.${className}`);
	            return domObject;
	        }
	        let divTemplate = `<div 
            class="btnRoot"
            >
            </div>`;
	        let btnTemplate = `<button 
            class="thingBtn BPText" 
            style="position:absolute;${dirX}:${x};${dirY}:${y};
            cursor:pointer;text-align:center;
            height:${height}px;line-height:${height}px;
            min-width:60px;
            padding:0 6px;box-sizing: border-box;
            white-space:nowrap;z-index:10000"
            >
            ${text}
        </button>`;
	        this.btnRoot = document.querySelector('.btnRoot');

	        if (!this.btnRoot) {
	            this.btnRoot = createDocument(divTemplate, 'btnRoot');
	        }
	        let oBtn = createDocument(btnTemplate, 'thingBtn');

	        if (width) {
	            oBtn.style.width = `${width}px`;
	        }
	        // Selector 的修改方式
	        // const temp = new THING.Selector()
	        // temp.push(oBtn)
	        // outputs['interface'] = oBtn;


	        oBtn.onclick = () => {
	            // outputs['fontText'] = oBtn.innerHTML.trim();
	            this.run('callback', outputs);
	        };

	        this.btnRoot.appendChild(oBtn);
	        oDiv3dBox.appendChild(this.btnRoot);

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this.btnRoot) {
	            this.btnRoot.remove();
	        }
	    }
	}

	class BPLayerButton extends BaseNode3D {
	  static config = {
	    name: 'BPLayerButton',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'option1',
	        type: 'string',
	      },
	      {
	        name: 'option2',
	        type: 'string',
	      },
	      {
	        name: 'option3',
	        type: 'string',
	      },
	      {
	        name: 'option4',
	        type: 'string',
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'press1',
	        type: 'callback',
	      },
	      {
	        name: 'press2',
	        type: 'callback',
	      },
	      {
	        name: 'press3',
	        type: 'callback',
	      },
	      {
	        name: 'press4',
	        type: 'callback',
	      }
	    ],
	  }

	  onExecute(data, inputs, outputs) {
	    let oLayerButtonRoot = document.querySelector('.layerButtonRoot');
	    if (oLayerButtonRoot) {
	      oLayerButtonRoot.remove();
	    }
	    let oDiv3dBox = document.querySelector("#div3d").parentNode;
	    // oDiv3dBox.style.position = 'relative';
	    function createDocument(template, className) {
	      let doc = new DOMParser().parseFromString(template, 'text/html');
	      let domObject = doc.querySelector(`.${className}`);
	      return domObject;
	    }
	    function addClassStyle() {
	      let styleTemplate = `<style class="layerButtonStyle">
          .layerButtonRoot,layerButtonRoot div{
            box-sizing:border-box;
          }
          .layerButtonRoot{
            position:absolute;top:10;left:10px;z-index:10000;
            height:56px;background: rgba(255,255,255,0.80);
            border-radius: 10px;
            filter: blur(0);
            padding:8px;
            left:50%;
            transform:translateX(-50%);
          }
          .layerButton{
            cursor:pointer;
            border-radius: 8px;
            display:inline-block;
            height: 16px;
            padding:12px 20px;
            font-size: 16px;
            color: #333333;
            letter-spacing: 0;
            text-align: center;
            line-height: 16px;
          }
          .layerButton:hover{
            background: rgba(30,54,102,0.06);
          }
          .layerButton.active{
            background: #48C672;
            color: #FFFFFF;
          }
          </style>`;
	      let oStyle = createDocument(styleTemplate, 'layerButtonStyle');
	      oDiv3dBox.appendChild(oStyle);
	    }
	    addClassStyle();
	    let divTemplateBegin = `<div class="layerButtonRoot" style="top:10px;">`;
	    let divTemplateEnd = `</div>`;

	    function createTemplate(text, idName) {
	      let template = `<div class="layerButton" id='${idName}'>${text}</div>`;
	      return template;
	    }

	    let radioTamplate = '';
	    if (inputs['option1']) {
	      radioTamplate += createTemplate(inputs['option1'], '1');
	    }
	    if (inputs['option2']) {
	      radioTamplate += createTemplate(inputs['option2'], '2');
	    }
	    if (inputs['option3']) {
	      radioTamplate += createTemplate(inputs['option3'], '3');
	    }
	    if (inputs['option4']) {
	      radioTamplate += createTemplate(inputs['option4'], '4');
	    }
	    if (!radioTamplate) return;
	    let template = divTemplateBegin + radioTamplate + divTemplateEnd;
	    this.oLayerButtonRoot = createDocument(template, 'layerButtonRoot');
	    oDiv3dBox.appendChild(this.oLayerButtonRoot);

	    this.oLayerButtonRoot.onclick = (ev) => {
	      let layerButtons = this.oLayerButtonRoot.querySelectorAll('.layerButton');
	      layerButtons.forEach((item) => {
	        item.classList.remove('active');
	      });
	      ev.target.classList.add('active');
	      this.run(`press${ev.target.id}`, outputs);
	    };
	  }
	  onStop() {
	    if (this.oLayerButtonRoot) {
	      this.oLayerButtonRoot.remove();
	    }
	  }

	}

	class BPCreateMarker extends BaseNode3D {
	    static config = {
	        name: 'BPCreateMarker',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                value: 'marker',
	                advanced: true
	            },
	            {
	                name: 'name',
	                type: 'string',
	                value: 'marker',
	            },
	            {
	                name: 'localPosition',
	                type: 'vector3',
	                value: [0, 0, 0],
	            },
	            {
	                name: 'parent',
	                type: 'selector'
	            },
	            {
	                name: 'localScale',
	                type: 'vector3',
	                value: [1, 1, 1],
	                advanced: true
	            },
	            {
	                name: 'image',
	                type: 'string',
	                value: `${BaseNode3D.BASEURL}image/alarm_build.png`
	            },
	            {
	                name: 'onParent',
	                type: 'boolean',
	                value: false,
	                advanced: true
	            },
	            {
	                name: 'renderType',
	                type: 'boolean',
	                value: true,
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ]
	    }

	    constructor() {
	        super();

	        this._objects = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let that = this;
	        let _parent = inputs['parent'];
	        let _name = inputs['name'] || 'marker';
	        let _id = inputs['id'] || 'marker';
	        let _localPosition = inputs['localPosition'] || [0, 0, 0];
	        let _localScale = inputs['localScale'] || [1, 1, 1];
	        let _image = inputs['image'] || './resource/bluePrint/images/alarm_build.png';
	        let _renderType = inputs['renderType'];
	        let _currentObjects = new THING.Selector();
	        let render;
	        if (_renderType) {
	            render = 'Sprite';
	        } else {
	            render = 'Plane';
	        }

	        function createMarker(_parent) {
	            let markerPositon = _localPosition;
	            if (inputs['onParent'] && _parent) {
	                markerPositon = THING.Math.addVector([_parent.position[0], _parent.position[1] + _parent.boundingBox.size[1], _parent.position[2]], _localPosition);
	            }

	            let _object = new THING.Marker({
	                id: _id,
	                name: _name,
	                localScale: _localScale,
	                position: markerPositon,
	                parent: _parent,
	                style: {
	                    image: _image,
	                },
	                renderType: THING.RenderType[render],
	            });
	            _currentObjects.push(_object);
	            that._objects.push(_object);
	        }
	        _parent.forEach((object) => {
	            createMarker(object);
	        });

	        outputs["object"] = _currentObjects;

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this._objects.destroy();
	        this._objects.clear();

	    }

	}

	class BPCreateTextLabel extends BaseNode3D {
	  static config = {
	    name: 'BPCreateTextLabel',
	    inputs: [{
	      name: 'exec',
	      type: 'exec',
	    },
	    {
	      name: 'id',
	      type: 'string',
	      value: 'label',
	      advanced: true
	    },
	    {
	      name: 'name',
	      type: 'string',
	      value: 'label',
	    },
	    {
	      name: 'position',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'parent',
	      type: 'selector'
	    },
	    {
	      name: 'fontText',
	      type: 'string',
	      desc: '未勾选富文本时，可输入普通文本，如：“文本内容”；当勾选富文本时，可输入p、span标签富文本，如：<p><span style="color:#974806">文本内容</span></p>'
	    },
	    {
	      name: 'color',
	      type: 'color',
	      value: '#ffffff',
	      advanced: true
	    },
	    {
	      name: 'fontSize',
	      type: 'number',
	      value: 72
	    },
	    {
	      name: 'richText',
	      type: 'boolean',
	      advanced: true
	    },
	    {
	      name: 'onParent',
	      type: 'boolean',
	      advanced: true
	    },
	      // {
	      //   name: 'fontType',
	      //   type: 'string',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'lineWidth',
	      //   type: 'number',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'lineHeight',
	      //   type: 'number',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'shadowColor',
	      //   type: 'color',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'shadowAlpha',
	      //   type: 'number',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'shadowAngle',
	      //   type: 'number',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'shadowBlur',
	      //   type: 'number',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'shadowDistance',
	      //   type: 'number',
	      //   advanced: true
	      // },
	      // {
	      //   name: 'AlignType',
	      //   type: 'select',
	      //   value: ['Center', 'Left', 'Top', 'TopLeft', 'TopRight', 'Right', 'Bottom', 'BottomLeft', 'BottomRight'],
	      //   advanced: true
	      // }
	    ],
	    outputs: [{
	      name: 'next',
	      type: 'exec',
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    },
	    ],
	  }

	  constructor() {
	    super();

	    this._objects = [];
	  }

	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _name = inputs['name'] || 'label';
	    let _id = inputs['id'] || 'label';
	    let parent = inputs['parent'][0];
	    let fontText = inputs['fontText'];
	    let color = inputs['color'];
	    let size = inputs['fontSize'];
	    let richText = inputs['richText'] || false;
	    let position = inputs['position'] || [0, 0, 0];
	    // let fontLineWidth = inputs['lineWidth'] || Number.MAX_SAFE_INTEGER
	    // let fontLineHeight = inputs['lineHeight'] || 0
	    // let fontShadowColor = inputs['shadowColor']
	    // let fontShadowAlpha = inputs['shadowAlpha'] || 1
	    // let fontShadowAngle = inputs['shadowAngle'] || 45
	    // let fontShadowBlur = inputs['shadowBlur'] || 1
	    // let fontShadowDistance = inputs['shadowDistance'] || 1
	    // let fontAlignType = inputs['alignType'] || 'Center'
	    if (!fontText) {
	      return;
	    } else {
	      fontText = fontText.toString();
	    }
	    if (inputs['onParent'] && parent) {
	      // parent = parent[0]
	      // parent.selfToWorld([1, 1, 1], true)
	      position = [0, parent.boundingBox.size[1], 0];

	    }
	    let _object = new THING.Label({
	      id: _id,
	      name: _name,
	      parent,
	      fontText,
	      fontSize: size,
	      fontColor: color,
	      richText,
	      localPosition: position,
	      // fontLineWidth,
	      // fontLineHeight,
	      // fontShadowColor,
	      // fontShadowAlpha,
	      // fontShadowAngle,
	      // fontShadowBlur,
	      // fontShadowDistance,
	      // fontAlignType,
	    });
	    let _selector = new THING.Selector();
	    _selector.push(_object);
	    outputs['object'] = _selector;

	    this._objects.push(_object);
	  }

	  // 当蓝图停止时被调用
	  onStop() {
	    if (this._objects.length > 0) {
	      for (let i = this._objects.length - 1; i >= 0; i--) {
	        if (this._objects[i] && !this._objects[i].destroyed) {
	          this._objects[i].destroy();
	        }
	      }

	      this._objects = [];
	    }
	  }

	}

	class BPSetBackgroundColor extends BaseNode3D {
	    static config = {
	        name: 'BPSetBackgroundColor',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#FFFFFF'
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ],
	    }

	    onExecute(data, inputs, outputs) {
	        let _backgroundColor = inputs['color'];
	        let app = this.app;
	        this._preBackground = app.background;
	        app.background = _backgroundColor;
	    }
	    onStop() {
	        this.app.background = this._preBackground;
	    }
	}

	class BPSetBackgroundImage extends BaseNode3D {
	    static config = {
	        name: 'BPSetBackgroundImage',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'image',
	                type: 'string',
	                value: `${BaseNode3D.BASEURL}image/background.png`
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ],
	    }

	    onExecute(data, inputs, outputs) {
	        let _image = inputs['image'];
	        var app = this.app;
	        this._preBackground = app.background;
	        app.background = new THING.ImageTexture(_image);
	    }
	    onStop() {
	        this.app.background = this._preBackground;
	    }

	}

	class BPSetSkyBox extends BaseNode3D {
	    static config = {
	        name: 'BPSetSkyBox',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'name',
	                type: 'select',
	                value: ['blue', 'milkyway', 'night', 'cloudy', 'white', 'dark']
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ],
	    }

	    constructor() {
	        super();
	        this._skyBox = `${BaseNode3D.BASEURL}image/skyboxes/`;
	        this.pre_envMap = this.app.envMap;
	        this.pre_background = this.app.background;
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        // Set skybox
	        let skybox = inputs['name'] || 'BlueSky';
	        let baseURL;
	        switch (skybox) {
	            case 'blue':
	            case 'milkyway':
	            case 'night':
	            case 'cloudy':
	            case 'white':
	            case 'dark':
	                baseURL = this._skyBox + skybox + '/';
	                break;
	        }
	        baseURL = baseURL ? baseURL : skybox;
	        const image = new THING.ImageTexture([
	            baseURL + 'posx.jpg', baseURL + 'negx.jpg',
	            baseURL + 'posy.jpg', baseURL + 'negy.jpg',
	            baseURL + 'posz.jpg', baseURL + 'negz.jpg'
	        ]);

	        // Set envMap and backgroud
	        this.app.envMap = image;
	        this.app.background = image;

	    }
	    // 当蓝图停止时被调用
	    onStop() {
	        this.app.envMap = this.pre_envMap;
	        this.app.background = this.pre_background;
	    }

	}

	class BPNumber extends BaseNode3D {

		static config = {
			name: 'BPNumber',
			inputs: [
				{
					name: 'value',
					type: 'number',
					visiblePin: false
				}
			],
			outputs: [
				{
					name: 'result',
					type: 'number'
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			outputs['result'] = inputs['value'];
		}

	}

	class BPString extends BaseNode3D {

		static config = {
			name: 'BPString',
			inputs: [
				{
					name: 'value',
					type: 'string',
					visiblePin: false
				}
			],
			outputs: [
				{
					name: 'result',
					type: 'string',
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			outputs['result'] = inputs['value'];
		}

	}

	class BPVector3 extends BaseNode3D {

		static config = {
			name: 'BPVector3',
			inputs: [
				{
					name: 'value',
					type: 'vector3',
					value: [0, 0, 0]
				}
			],
			outputs: [
				{
					name: 'result',
					type: 'vector3'
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let _value = inputs['value'] || [0, 0, 0];
			outputs['result'] = _value;
		}

	}

	class BPVector2 extends BaseNode3D {

		static config = {
			name: 'BPVector2',
			inputs: [
				{
					name: 'value',
					type: 'vector2',
					value: [0, 0],
					visiblePin: false
				}
			],
			outputs: [
				{
					name: 'result',
					type: 'vector2'
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let _value = inputs['value'] || [0, 0];
			outputs['result'] = _value;
		}

	}

	class BPObjectCallFunction extends BaseNode3D {
	  static config = {
	    name: 'BPObjectCallFunction',
	    desc: 'obj.callFunction',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'object',
	      type: 'selector',
	    },
	    {
	      name: 'name',
	      type: 'string',
	    },
	    {
	      name: 'parameters',
	      type: 'string',
	    },
	    {
	      name: 'recursive',
	      type: 'boolean',
	      value: true
	    },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ],
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _name = inputs['name'];
	    let _object = inputs['object'];
	    let _parameters = inputs['parameters'];
	    let recursive = inputs['recursive'];
	    if (_object && _object.isSelector) {
	      _object.forEach((obj) => {
	        obj.callFunction({
	          funcName: _name,
	          args: _parameters,
	          recursive
	        });
	      });
	    }
	  }
	}

	class BPBranch extends BaseNode3D {

		static config = {
			name: 'BPBranch',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'condition',
					type: 'any',
				},
				{
					name: 'parameters',
					type: 'any',
					advanced: true
				}
			],
			outputs: [
				{
					name: 'true',
					type: 'exec'
				},
				{
					name: 'false',
					type: 'exec'
				},
				{
					name: 'parameters',
					type: 'unknown',
					advanced: true
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let value = inputs['condition'];
			if (inputs['parameters']) {
				outputs['parameters'] = inputs['parameters'];
			}
			if (value) {
				outputs['false'] = false;
			}
			else {
				outputs['true'] = false;
			}
		}

	}

	class BPSwitch extends BaseNode3D {

		static config = {
			name: 'BPSwitch',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'condition',
					type: ['any'],
				},
				{
					name: 'caseArray',
					type: 'array',
				},
			],
			outputs: [
				{
					name: 'default',
					type: 'callback'
				},
			],
			dynamic: {
				inputOrOutput: 'output',
				type: 'callback',
				label: 'callback[index]',
				length: 1
			}
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let value = inputs['condition'];
			if (typeof (value) == 'string') {
				value = "'" + value + "'";
			}
			let caseArray = inputs['caseArray'];
			var str = "switch(" + value + "){";
			for (var j = 0; j < caseArray.length; j++) {
				if (typeof (caseArray[j]) != 'number' && typeof (caseArray[j]) != 'string') {
					console.warn("case value can only be number or string!");
					continue;
				}
				if (typeof (caseArray[j]) == 'string') {
					caseArray[j] = "'" + caseArray[j] + "'";
				}
				str = str + "case " + caseArray[j] + ":this.run('BPSwitch--" + j + "', outputs);break;";
			}
			str = str + "default :this.run('default', outputs);break;";
			str = str + "}";

			// alert(str)
			eval(str);
		}

	}

	class BPDelay extends BaseNode3D {
		static config = {
			name: 'BPDelay',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'time',
					type: 'number',
					value: 1
				},
				{
					name: 'data',
					type: 'any',
					advanced: true
				}
			],
			outputs: [
				{
					name: 'trigger',
					type: 'callback'
				},
				{
					name: 'data',
					type: 'unknown',
				}
			]
		};

		constructor() {
			super();
			this._timers = [];
		}

		onExecute(data, inputs, outputs) {
			let time = handleTime(inputs['time']);

			if (inputs['data']) {
				outputs['data'] = inputs['data'];
			}

			let that = this;
			let timer = setTimeout(() => {
				that.run('trigger', outputs);
			}, time);

			this._timers.push(timer);

			function handleTime(time) {
				let reg = /^\d+(\.\d+)?$/;
				if (reg.test(time)) {
					return time * 1000;
				} else {
					return 0;
				}
			}
		}

		onStop() {
			this._timers.forEach((item) => {
				clearTimeout(item);
			});
			this._timers = [];

		}

	}

	class BPForLoop extends BaseNode3D {
		static config = {
			name: 'BPForLoop',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'firstIndex',
					type: 'number',
					value: 1,
				}
				,
				{
					name: 'lastIndex',
					type: 'number',
					value: 100,
				}
			],
			outputs: [
				{
					name: 'complete',
					type: 'callback'
				},
				{
					name: 'next',
					type: 'callback'
				},
				{
					name: 'arrayIndex',
					type: 'number'
				},
			]
		};

		constructor() {
			super();
			this.index = 0;
		}

		onExecute(data, inputs, outputs) {
			let idx0 = inputs['firstIndex'];
			let idx1 = inputs['lastIndex'];

			for (let i = idx0; i < idx1; i++) {
				outputs['arrayIndex'] = i;
				this.run('next', outputs);
			}
		}

		onStop() {

		}

	}

	class BPForEachLoop extends BaseNode3D {
		static config = {
			name: 'BPForEachLoop',
			inputs: [{
				name: 'exec',
				type: 'exec'
			},
			{
				name: 'array',
				type: ['array', 'selector'],
			}
			],
			outputs: [{
				name: 'complete',
				type: 'callback'
			},
			{
				name: 'next',
				type: 'callback'
			},
			{
				name: 'arrayElement',
				type: ['any', 'selector']
			},
			{
				name: 'arrayIndex',
				type: 'number'
			},
			]
		};

		constructor() {
			super();
			this.index = 0;
			this._objects = new THING.Selector();
		}

		onExecute(data, inputs, outputs) {
			let _array = inputs['array'];
			let item;
			for (let i = 0; i < _array.length; i++) {
				if (_array.isSelector) {
					this._objects.clear();
					this._objects.push(_array[i]);
					item = this._objects;
				} else {
					item = _array[i];
				}
				this.run('next', {
					arrayElement: item,
					arrayIndex: i
				});
			}

			this.run('complete');
		}

		onStop() {

		}

	}

	class BPFlipFlop extends BaseNode3D {
		static config = {
			name: 'BPFlipFlop',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'params',
					type: 'any',
					advanced: true
				},
				{
					name: 'defaultOpen',
					type: 'boolean',
					value: true

				}

			],
			outputs: [
				{
					name: 'A',
					type: 'callback'
				},
				{
					name: 'B',
					type: 'callback'
				},
				{
					name: 'IsA',
					type: 'boolean'
				},
				{
					name: 'params',
					type: 'any',
					advanced: true
				}
			]
		};

		constructor() {
			super();
			this._isA = false;
		}

		onExecute(data, inputs, outputs) {
			this._isA = !this._isA;
			outputs['IsA'] = this._isA;
			outputs['params'] = inputs['pramas'];
			if (inputs['defaultOpen']) {
				if (this._isA) this.run('B',  { IsA: false, params: inputs['params'] });
				else this.run('A',  { IsA: true,  params: inputs['params'] });
			} else {
				if (this._isA) this.run('A',  { IsA: true, params: inputs['params'] });
				else this.run('B',  { IsA: false,  params: inputs['params'] });
			}

		}

		onStop() {
			this._isA = false;
		}
	}

	class BPTimer extends BaseNode3D {
		static config = {
			name: 'BPTimer',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'time',
					type: 'number',
					value: 1,
				},
				{
					name: 'times',
					type: 'number',
					advanced: true,
				},
				{
					name: 'options',
					type: 'any',
					advanced: true,
				}
			],
			outputs: [
				{
					name: 'callback',
					type: 'callback',
				},
				{
					name: 'currentTimes',
					type: 'number',
					advanced: true,
				},
				{
					name: 'options',
					type: 'unknown',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
		}
		onExecute(data, inputs, outputs) {
			let times = inputs.times;
			let time = handleTime(inputs['time']);
			outputs['options'] = inputs['options'];
			this.currentTimes = 0;
			this._timer = setInterval(() => {
				this.currentTimes++;
				outputs.currentTimes = this.currentTimes;
				this.run('callback', outputs);
				if (times === this.currentTimes) {
					clearTimeout(this._timer);
				}
			}, time);
			function handleTime(time) {
				let reg = /^\d+(\.\d+)?$/;
				if (reg.test(time)) {
					return time * 1000;
				} else {
					return 0;
				}
			}
		}

		onStop() {
			clearTimeout(this._timer);
		}

	}

	class BPIsEqual extends BaseNode3D {
		static config = {
			name: 'BPIsEqual',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'param1',
					type: 'any',
					input: true,
				}
				,
				{
					name: 'param2',
					type: 'any',
					input: true,
				}
			],
			outputs: [
				{
					name: 'equal',
					type: 'callback'
				},
				{
					name: 'noEqual',
					type: 'callback'
				},
				{
					name: 'param1',
					type: 'any',
					advanced: true,
				}
				,
				{
					name: 'param2',
					type: 'any',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
		}
		isObject(obj) {
			return typeof obj === 'object' && obj !== null
		}

		isEqual(a, b) {
			if (a === b) return true
			var isObjectA = this.isObject(a);
			var isObjectB = this.isObject(b);
			if (isObjectA && isObjectB) {
				try {
					var isArrayA = Array.isArray(a);
					var isArrayB = Array.isArray(b);
					if (isArrayA && isArrayB) { // a b都是数组
						return a.length === b.length && a.every((el, index) => this.isEqual(el, b[index]))
					} else if (a instanceof Date && b instanceof Date) { // a b都是Date对象
						return a.getTime() === b.getTime()
					} else if (!isArrayA && !isArrayB) { // 此时a b都是纯对象
						var keyA = Object.keys(a);
						var keyB = Object.keys(b);
						return keyA.length === keyB.length && keyA.every(key => this.isEqual(a[key], b[key]))
					} else {
						return false
					}
				} catch (e) {
					console.log(e);
					return false
				}
			} else if (!isObjectA && !isObjectB) { // a b 可能是string，number，boolean，undefined中的一种
				return String(a) === String(b)
			} else {
				return false
			}
		}

		onExecute(data, inputs, outputs) {
			let param1 = inputs.param1;
			let param2 = inputs.param2;
			outputs.param1 = param1;
			outputs.param2 = param2;
			if (this.isEqual(param1, param2)) {
				this.run('equal', outputs);
			} else {
				this.run('noEqual', outputs);
			}

		}

		onStop() {

		}

	}

	class BPNumberCompare extends BaseNode3D {
		static config = {
			name: 'BPNumberCompare',
			inputs: [{
				name: 'exec',
				type: 'exec'
			},
			{
				name: 'param1',
				type: 'number',
				input: true,
			},
			{
				name: 'param2',
				type: 'number',
				input: true,
			}
			],
			outputs: [{
				name: 'greater',
				type: 'callback'
			},
			{
				name: 'less',
				type: 'callback'
			},
			{
				name: 'equal',
				type: 'callback'
			},
			{
				name: 'param1',
				type: 'number',
				advanced: true,
			},
			{
				name: 'param2',
				type: 'number',
				advanced: true,
			}
			]
		};

		constructor() {
			super();
		}
		onExecute(data, inputs, outputs) {
			let param1 = inputs.param1;
			let param2 = inputs.param2;
			outputs.param1 = param1;
			outputs.param2 = param2;
			if (param1 > param2 && param1 != param2) {
				this.run('greater', outputs);
			} else if (param1 < param2 && param1 != param2) {
				this.run('less', outputs);
			} else if (param1 == param2) {
				this.run('equal', outputs);
			}

		}

		onStop() {

		}

	}

	class BPIsExist extends BaseNode3D {
		static config = {
			name: 'BPIsExist',
			inputs: [
				{
					name: 'exec',
					type: 'exec',
				},
				{
					name: 'param',
					type: 'any',
					input: true,
				}
			],
			outputs: [
				{
					name: 'exist',
					type: 'callback'
				},
				{
					name: 'noexist',
					type: 'callback'
				},
				{
					name: 'param',
					type: 'unknown',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
			this.index = 0;
		}

		onExecute(data, inputs, outputs) {
			let param = inputs['param'];
			outputs.param = param;
			if (param) {
				this.run('exist', outputs);
			} else {
				this.run('noexist', outputs);
			}
		}
		onStop() {
		}

	}

	class BPIsContains extends BaseNode3D {
		static config = {
			name: 'BPIsContains',
			inputs: [{
				name: 'exec',
				type: 'exec'
			},
			{
				name: 'collection',
				type: ['array', 'selector', 'string']
			},
			{
				name: 'object',
				type: 'any',
			}
			],
			outputs: [{
				name: 'contains',
				type: 'callback'
			},
			{
				name: 'noContains',
				type: 'callback'
			},
			{
				name: 'collection',
				type: ['array', 'selector'],
				advanced: true,
			},
			{
				name: 'object',
				type: 'unknown',
				advanced: true,
			}
			]
		};

		constructor() {
			super();
		}
		isObject(obj) {
			return typeof obj === 'object' && obj !== null
		}

		isEqual(a, b) {
			if (a === b) return true
			var isObjectA = this.isObject(a);
			var isObjectB = this.isObject(b);
			if (isObjectA && isObjectB) {
				try {
					var isArrayA = Array.isArray(a);
					var isArrayB = Array.isArray(b);
					if (isArrayA && isArrayB) { // a b都是数组
						return a.length === b.length && a.every((el, index) => this.isEqual(el, b[index]))
					} else if (a instanceof Date && b instanceof Date) { // a b都是Date对象
						return a.getTime() === b.getTime()
					} else if (!isArrayA && !isArrayB) { // 此时a b都是纯对象
						var keyA = Object.keys(a);
						var keyB = Object.keys(b);
						return keyA.length === keyB.length && keyA.every(key => this.isEqual(a[key], b[key]))
					} else {
						return false
					}
				} catch (e) {
					console.log(e);
					return false
				}
			} else if (!isObjectA && !isObjectB) { // a b 可能是string，number，boolean，undefined中的一种
				return String(a) === String(b)
			} else {
				return false
			}
		}

		isContains(collection, object) {
			let isContains = false;
			if (!collection || !object) return
			if (typeof collection === 'string' && typeof object === 'string') {
				if (collection.indexOf(object) !== -1) {
					isContains = true;
					return isContains;
				} else {
					return isContains;
				}
			}
			collection.forEach(element => {
				if (element.isSelector && element.length > 0) {
					element = element[0];
				}
				if (this.isEqual(element, object)) {
					isContains = true;
					return;
				}
			});
			return isContains;
		}
		onExecute(data, inputs, outputs) {
			let collection = inputs.collection;
			if (collection && collection.isSelector) {
				collection = collection.objects;
			}
			let object = inputs.object;
			if (object && object.isSelector && object.length > 0) {
				object = object[0];
			}
			outputs.collection = inputs.collection;
			outputs.object = inputs.object;
			if (this.isContains(collection, object)) {
				this.run('contains', outputs);
			} else {
				this.run('noContains', outputs);
			}
		}

		onStop() {

		}

	}

	class BPIsEmpty extends BaseNode3D {
		static config = {
			name: 'BPIsEmpty',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'param',
					type: 'any',
					input: true,
				}
			],
			outputs: [
				{
					name: 'empty',
					type: 'callback'
				},
				{
					name: 'noEmpty',
					type: 'callback'
				},
				{
					name: 'param',
					type: 'unknown',
					advanced: true,
				}
			]
		};

		constructor() {
			super();
		}
		isObject(obj) {
			return typeof obj === 'object' && obj !== null
		}

		isEmpty(param) {
			let isEmpty = true;
			if (param instanceof Array) {
				if (param.length) {
					isEmpty = false;
				}
			} else if (param && param.isSelector) {
				let objects = param.objects;
				if (objects.length) {
					isEmpty = false;
				}
			} else if (param) {
				isEmpty = false;
			}
			return isEmpty;

		}

		onExecute(data, inputs, outputs) {
			let param = inputs.param;
			outputs.param = param;
			if (this.isEmpty(param)) {
				this.run('empty', outputs);
			} else {
				this.run('noEmpty', outputs);
			}
		}

		onStop() {

		}

	}

	class BPIsObjectTag extends BaseNode3D {
		static config = {
			name: 'BPIsObjectTag',
			inputs: [
				{
					name: 'exec',
					type: 'exec'
				},
				{
					name: 'tag',
					type: 'string'
				}
				,
				{
					name: 'object',
					type: 'selector',
				}
			],
			outputs: [
				{
					name: 'yes',
					type: 'callback'
				},
				{
					name: 'no',
					type: 'callback'
				},
				{
					name: 'object',
					type: 'unknown',
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let tag = inputs.tag;
			let object = inputs.object;
			outputs.object = object;

			if (object && object.isSelector && object.length > 0) {
				object = object[0];
			}
			if (object && object.tags && object.tags.has(tag)) {
				this.run('yes', outputs);
			} else {
				this.run('no', outputs);
			}
		}

		onStop() {

		}

	}

	class BPRandomInteger extends BaseNode3D {
	    static config = {
	        name: 'BPRandomInteger',
	        inputs: [
	            {
	                name: 'min',
	                type: 'number',
	                value: 0
	            },
	            {
	                name: 'max',
	                type: 'number',
	                value: 100
	            }
	        ],
	        outputs: [
	            {
	                name: 'result',
	                type: 'number',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let min = inputs['min'];
	        let max = inputs['max'];
	        let res = min + Math.random() * (max - min);
	        res = parseInt(res);
	        outputs['result'] = res;
	    }
	}

	class BPRandomFloat extends BaseNode3D {
	    static config = {
	        name: 'BPRandomFloat',
	        inputs: [
	            {
	                name: 'min',
	                type: 'number',
	                value: 0
	            },
	            {
	                name: 'max',
	                type: 'number',
	                value: 100
	            },
	        ],
	        outputs: [
	            {
	                name: 'result',
	                type: 'number',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let min = inputs['min'];
	        let max = inputs['max'];

	        let res = min + Math.random() * (max - min);

	        outputs['result'] = res;
	    }
	}

	class BPGetElementFromArray extends BaseNode3D {
	    static config = {
	        name: 'BPGetElementFromArray',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'array',
	                type: ['array', 'selector'],
	            },
	            {
	                name: 'index',
	                type: 'number',
	                value: 0
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'item',
	                type: 'unknown',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _arr = inputs['array'];
	        let _idx = inputs['index'] || 0;
	        if (_arr) {
	            if (_arr.isSelector && _arr.length > _idx)
	                outputs['item'] = _arr.slice(_idx, _idx + 1);
	            else if (_arr.length > _idx)
	                outputs['item'] = _arr[_idx];
	        } else
	            console.error('please check the array!');
	    }
	}

	class BPArrayPushItem extends BaseNode3D {
	    static config = {
	        name: 'BPArrayPushItem',
	        inputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'array',
	            type: 'array',
	        },
	        {
	            name: 'item',
	            type: 'any',
	        },
	        ],
	        outputs: [{
	            name: 'exec',
	            type: 'exec',
	        },
	        {
	            name: 'array',
	            type: 'array',
	        },
	        ]
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let array = inputs['array'];
	        let item = inputs['item'];
	        if (array && array instanceof Array) {
	            if (item) {
	                array.push(item);

	            }
	        }
	        outputs['array'] = array;
	    }
	}

	class BPConvertAnyToVector3 extends BaseNode3D {
		static config = {
			name: 'BPConvertAnyToVector3',
			inputs: [

				{
					name: 'params',
					type: 'any',
				}
			],
			outputs: [

				{
					name: 'result',
					type: 'vector3'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let _value = inputs['params'];
			let pivot = [];
			if (typeof _value === 'number') {
				// 如果输入是数字类型（整数或浮点数）
				pivot = [_value, _value, _value];
			} else if (typeof _value === 'string') {
				// 如果输入是字符串类型
				// 这里假设输入的字符串格式为 "x,y,z"，例如 "1.0,2.0,3.0"
				var values = _value.split(',');
				if (values.length === 3) {
					pivot.push(Number(values[0]));
					pivot.push(Number(values[1]));
					pivot.push(Number(values[2]));
				} else {
					// 字符串格式不正确，无法转换为Vector3类型
					pivot = [0, 0, 0];
				}
			} else if (_value instanceof Array && _value.length == 3) {
				_value.forEach(item => {
					item = Number(item);
					pivot.push(item);
				});
				if (isNaN(pivot[0]) || isNaN(pivot[1]) || isNaN(pivot[2])) {
					// 数组元素包含无效的数值，无法转换为Vector3类型
					pivot = [0, 0, 0];
				}
			} else {
				// 对于其他类型，根据具体需求进行转换处理
				pivot = [0, 0, 0];
			}
			outputs['result'] = pivot;

		}
	}

	class BPArray extends BaseNode3D {
		static config = {
			name: 'BPArray',
			inputs: [
				{
					name: 'array',
					type: 'any',
				}
			],
			outputs: [

				{
					name: 'result',
					type: 'array'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {


			let _value = inputs['array'];
			let pivot = [];
			try {
				if (_value instanceof Array) {
					_value.forEach(item => {
						item = JSON.parse(item);
						pivot.push(item);
					});
				} else if (typeof _value === 'string') {
					_value = this.fixIrregularJSON(_value);
					pivot = JSON.parse(_value);//['太空人','测试']
				}

			} catch (error) {

			}
			outputs['result'] = pivot;


		}
	}

	class BPRandomVector3Array extends BaseNode3D {
	    static config = {
	        name: 'BPRandomVector3Array',
	        group: 'Basic',
	        inputs: [
	            {
	                name: 'min',
	                type: 'vector3',
	                value: [0, 0, 0],
	                visiblePin: false
	            },
	            {
	                name: 'max',
	                type: 'vector3',
	                value: [1, 1, 1],
	                visiblePin: false
	            },
	            {
	                name: 'length',
	                type: 'number',
	                value: 5,
	                visiblePin: false
	            },
	        ],
	        outputs: [
	            {
	                name: 'result',
	                type: 'array',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.points = [];
	    }
	    onExecute(data, inputs, outputs) {
	        const min = inputs['min'] || [0, 0, 0];
	        const max = inputs['max'] || [1, 0, 1];
	        let len = inputs['length'] || 10;
	        let points = this._randomPoints(min, max, len);
	        this.points = points;
	        outputs['result'] = points;
	    }

	    _randomPoints(min, max, len) {
	        const points = [];
	        for (let i = 0; i < len; i++) {
	            points.push(THING.Math.randomVector(min, max));
	        }
	        return points
	    }

	    onStop() {
	        this.points = [];
	    }
	}

	class BPRandomVector3 extends BaseNode3D {
	    static config = {
	        name: 'BPRandomVector3',
	        group: 'Basic',
	        inputs: [
	            {
	                name: 'min',
	                type: 'vector3',
	                value: [0, 0, 0],
	                visiblePin: false
	            },
	            {
	                name: 'max',
	                type: 'vector3',
	                value: [1, 1, 1],
	                visiblePin: false
	            }
	        ],
	        outputs: [
	            {
	                name: 'result',
	                type: 'vector3',
	            },
	        ],
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const min = inputs['min'] || [0, 0, 0];
	        const max = inputs['max'] || [1, 1, 1];
	        let point = THING.Math.randomVector(min, max);
	        outputs['result'] = point;
	    }
	}

	class BPVector3Add extends BaseNode3D {

		static config = {
			name: 'BPVector3Add',
			inputs: [
				{
					name: 'value0',
					type: 'vector3',
					value: [0, 0, 0],
				},
				{
					name: 'value1',
					type: 'vector3',
					value: [0, 0, 0],
				}
			],
			outputs: [
				{
					name: 'result',
					type: 'vector3'
				}
			]
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let _value0 = inputs['value0'] || [0, 0, 0];
			let _value1 = inputs['value1'] || [0, 0, 0];
			outputs['result'] = THING.Math.addVector(_value0, _value1);
		}

	}

	class BPGetLastNumberStr extends BaseNode3D {
	    static config = {
	        name: 'BPGetLastNumberStr',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'string',
	                type: 'string',
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'lastNumber',
	                type: 'string'
	            }
	        ]
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let str = inputs['string'];
	        outputs['lastNumber'] = null;
	        var reg = /(\d+)$/g;
	        var result = reg.exec(str);
	        if (result) {
	            outputs['lastNumber'] = result[1];
	        }
	    }
	    onStop() {

	    }

	}

	class BPRandomFromArray extends BaseNode3D {
	    static config = {
	        name: 'BPRandomFromArray',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'array',
	                type: 'array',
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'result',
	                type: 'vector3',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let point = THING.Math.randomFromArray(inputs['array']);
	        outputs['result'] = point;
	    }
	}

	class BPRandomColor extends BaseNode3D {
	    static config = {
	        name: 'BPRandomColor',
	        outputs: [
	            {
	                name: 'color',
	                type: 'color',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _randomColor = THING.Math.randomColor();
	        outputs['color'] = _randomColor;
	        // outputs['color'] = THING.Utils.toColorHexString(_randomColor)
	    }
	}

	class BPCreateCircleVector3Array extends BaseNode3D {
	    static config = {
	        name: 'BPCreateCircleVector3Array',
	        group: 'Basic',
	        inputs: [
	            {
	                name: 'position',
	                type: 'vector3',
	                value: [0, 0, 0]
	            },
	            {
	                name: 'radius',
	                type: 'number',
	                value: 5
	            },
	            {
	                name: 'segments',
	                type: 'number',
	                value: 50
	            }
	        ],
	        outputs: [
	            {
	                name: 'result',
	                type: 'array',
	            },
	        ],
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        let position = inputs['position'];
	        let radius = inputs['radius'];
	        let segments = inputs['segments'];

	        let result = [];
	        for (var i = 0; i < segments; i++) {
	            let degree = 360 / segments * i;

	            let x = position[0] + Math.cos(Math.PI * 2 / 360 * degree) * radius;
	            let z = position[2] + Math.sin(Math.PI * 2 / 360 * degree) * radius;

	            result.push([x, position[1], z]);
	        }
	        result.push([radius + position[0], position[1], 0 + position[2]]);

	        outputs['result'] = result;
	    }
	}

	class BPStringAdd extends BaseNode3D {
	    static config = {
	        name: 'BPStringAdd',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'param1',
	                type: 'string',
	                input: true,
	            },
	            {
	                name: 'param2',
	                type: 'string',
	                input: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'result',
	                type: 'string',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let str1 = inputs['param1'];
	        let str2 = inputs['param2'];

	        outputs['result'] = str1 + str2;
	    }
	}

	class BPNumberMultiply extends BaseNode3D {
	    static config = {
	        name: 'BPNumberMultiply',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'param1',
	                type: 'number',
	                input: true,
	            },
	            {
	                name: 'param2',
	                type: 'number',
	                input: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'result',
	                type: 'number',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let num1 = inputs['param1'];
	        let num2 = inputs['param2'];

	        let s1 = num1.toString(), s2 = num2.toString();

	        let decimalPlaces1 = s1.split('.')[1]?.length || 0;
	        let decimalPlaces2 = s2.split('.')[1]?.length || 0;

	        let maxPlaces = decimalPlaces1 + decimalPlaces2;
	        let powNUmber = Math.pow(10, maxPlaces);

	        let result = Number(num1) * Number(num2);
	        if (result < 0) {
	            result = - Math.round(Math.abs(result) * powNUmber) / powNUmber;
	        } else {
	            result = Math.round(result * powNUmber) / powNUmber;
	        }

	        let resultPlaces = result.toString().split('.')[1]?.length || 0;
	        if (resultPlaces > maxPlaces) {
	            result = Number(result.toFixed(maxPlaces));
	        }

	        outputs['result'] = result;
	    }
	}

	class BPNumberSubtract extends BaseNode3D {
	    static config = {
	        name: 'BPNumberSubtract',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'param1',
	                type: 'number',
	                input: true,
	            },
	            {
	                name: 'param2',
	                type: 'number',
	                input: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'result',
	                type: 'number',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let num1 = inputs['param1'];
	        let num2 = inputs['param2'];

	        let decimalPlaces1 = num1.toString().split('.')[1]?.length || 0;
	        let decimalPlaces2 = num2.toString().split('.')[1]?.length || 0;

	        let maxPlaces = decimalPlaces1 > decimalPlaces2 ? decimalPlaces1 : decimalPlaces2;
	        let powNUmber = Math.pow(10, maxPlaces);

	        let result = Number(num1) - Number(num2);
	        if (result < 0) {
	            result = - Math.round(Math.abs(result) * powNUmber) / powNUmber;
	        } else {
	            result = Math.round(result * powNUmber) / powNUmber;
	        }

	        result = Number(result.toFixed(maxPlaces));
	        
	        outputs['result'] = result;
	    }
	}

	class BPNumberAdd extends BaseNode3D {
	    static config = {
	        name: 'BPNumberAdd',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'param1',
	                type: 'any',
	                input: true,
	            },
	            {
	                name: 'param2',
	                type: 'any',
	                input: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'result',
	                type: 'number',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let num1 = inputs['param1'];
	        let num2 = inputs['param2'];

	        let decimalPlaces1 = num1.toString().split('.')[1]?.length || 0;
	        let decimalPlaces2 = num2.toString().split('.')[1]?.length || 0;

	        let maxPlaces = decimalPlaces1 > decimalPlaces2 ? decimalPlaces1 : decimalPlaces2;
	        let powNUmber = Math.pow(10, maxPlaces);

	        let result = Number(num1) + Number(num2);
	        if (result < 0) {
	            result = - Math.round(Math.abs(result) * powNUmber) / powNUmber;
	        } else {
	            result = Math.round(result * powNUmber) / powNUmber;
	        }

	        result = Number(result.toFixed(maxPlaces));

	        outputs['result'] = result;
	    }
	}

	class BPPickupColor extends BaseNode3D {
	    static config = {
	        name: 'BPPickupColor',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'color',
	                type: 'color',
	                value: '#ffffff'
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'color',
	                type: 'color',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        outputs['color'] = inputs['color'];
	    }
	}

	class BPObject extends BaseNode3D {
	  static config = {
	    name: 'BPObject',
	    inputs: [
	      {
	        name: 'uuid',
	        type: 'string',
	        visible: false
	      }
	    ],
	    outputs: [
	      {
	        name: 'object',
	        type: 'selector'
	      },
	    ]
	  };

	  onExecute(data, inputs, outputs) {
	    let uuid = inputs.uuid;
	    outputs.object = this.app.query(`[uuid = ${uuid}]`).slice(0, 1);
	  }
	}

	class BPObjects extends BaseNode3D {
	  static config = {
	    name: 'BPObjects',
	    inputs: [
	      {
	        name: 'uuids',
	        type: 'array',
	        visible: false
	      }
	    ],
	    outputs: [
	      {
	        name: 'objects',
	        type: 'selector'
	      },
	    ]
	  };

	  onExecute(data, inputs, outputs) {
	    let uuids = inputs.uuids;
	    outputs.objects = new THING.Selector();
	    uuids.map((uuid) => {
	      outputs.objects.push(this.app.query(`[uuid = ${uuid}]`)[0]);
	    });
	  }
	}

	class BPState extends BaseNode3D {
		static config = {
			name: 'BPState',
			inputs: [
				{
					name: 'enter',
					type: 'exec'
				},
				{
					name: 'leave',
					type: 'exec'
				},
				{
					name: 'enterOptions',
					type: 'any',
					advanced: true
				},
				{
					name: 'leaveOptions',
					type: 'any',
					advanced: true
				},
				{
					name: 'mutexState',
					type: 'boolean',
					value: true,
					advanced: true
				},
				{
					name: 'leaveWithLevel',
					type: 'boolean',
					value: true,
					advanced: true,
					desc: '仅当前层级生效'
				}
			],
		};

		constructor() {
			super();
		}

		onExecute(data, inputs, outputs) {
			let uid = data['id'];
			this.uid = uid;
			let state = this.app.stateManager.get(uid);
			if (!state) {
				this.app.stateManager.register(uid, new THING.BaseState());
			}

			let execName = this.curExecName;
			let mutexState = inputs['mutexState'];
			let enterOptions = inputs['enterOptions'] || {};
			let leaveOptions = inputs['leaveOptions'] || {};
			this.leaveOptions = leaveOptions;

			if (execName == 'enter') {
				if (mutexState) {
					this.app.stateManager.change(uid, enterOptions);
				} else {
					this.app.stateManager.set(uid, enterOptions);
				}
			}
			else if (execName == 'leave') {
				this.app.stateManager.leave(uid, leaveOptions);
			}

			// 切换别的层级退出本状态
			this.leaveWithLevel = inputs['leaveWithLevel'];
			if (this.leaveWithLevel) {
				let curLevel = this.app.level.current;
				let that = this;
				this.app.on(THING.EventType.BeforeEnterLevel, (ev) => {

					if (curLevel != ev.current) {

						that.app.stateManager.leave(uid, leaveOptions);
					}

				}, 'ChangeLevel-BP' + uid);
			}
		}

		onStop() {
			let state = this.app.stateManager.get(this.uid);
			if (state) {
				this.app.stateManager.leave(this.uid, this.leaveOptions);
			}

			if (this.leaveWithLevel) {
				this.app.off(THING.EventType.AfterEnterLevel, 'ChangeLevel-BP' + this.uid);
			}

		}


	}

	class BPStateEvent extends BaseNode3D {
		static config = {
			name: 'BPStateEvent',
			outputs: [
				{
					name: 'enter',
					type: 'callback',
				},
				{
					name: 'leave',
					type: 'callback',
				},
				{
					name: 'options',
					type: 'unknown',
				}

			],
		};

		constructor() {
			super();
		}

		isEntrance() {
			return true
		}

		onExecute(data, inputs, outputs) {
			let that = this;

			let app = this.app;

			let stubID = data['stubID'];
			this.uid = data['id'];

			app.on(THING.EventType.EnterState, function (ev) {
				if (ev.current.name == stubID) {
					outputs['options'] = ev.options;
					that.run('enter', outputs);
				}
			}, 'EnterState-BP' + this.uid);

			app.on(THING.EventType.LeaveState, function (ev) {

				if (!ev.current) return;
				if (ev.current.name == stubID) {
					outputs['options'] = ev.options;
					that.run('leave', outputs);
				}

			}, 'LeaveState-BP' + this.uid);

		}

		onStop() {
			this.app.off(THING.EventType.LeaveState, 'EnterState-BP' + this.uid);
			this.app.off(THING.EventType.LeaveState, 'LeaveState-BP' + this.uid);
		}


	}

	// 通用

	THING.BLUEPRINT.BPObject = BPObject;
	THING.BLUEPRINT.BPObjects = BPObjects;
	THING.BLUEPRINT.BPState = BPState;
	THING.BLUEPRINT.BPStateEvent = BPStateEvent;

	let {
	    BPBeginNode, BPSequenceNode, BPArrayNode,
	    BPEventNotifierNode, BPEventTriggerNode, BPAnyVarSetterNode, BPAnyVarGetterNode
	} = THING.BLUEPRINT;



	//ue blueprint node placeholder : do not remove this line , ue blueprint node generator would insert nodes at here procedurally.
	//@import_insert
	var BPNodes = {
	    CommonNodes: [
	        BPBeginNode,
	        BPPrint,
	        BPSequenceNode,
	        BPRegisterBlueprintNode
	    ],
	    CampusNodes: [
	        BPLoad,
	        BPLoadTheme,
	        BPChangeLevel,
	        BPGetCurrentLevel,
	        BPGetPrevLevel,
	        BPLevelBack,
	        BPExpandFloors,
	        BPCreateLevelTreeUI
	    ],
	    ObjectNodes: {
	        BasicNodes: [
	            BPCreateEntity,
	            BPBatchCreateEntity,
	            BPCreateParticleSystem,
	            BPCreateCubeTexture,
	            // BPCreateGeometry,
	            // BPBatchCreateGeometry,
	            BPCreateWater,
	            // BPCreateClippingPlanes,
	            BPObjectGetBasicAttribute,
	            BPObjectSetBasicAttribute,
	            BPQueryObject,
	            BPObjectSet,
	            BPCloneObject,
	            BPObjectGetParent,
	            BPObjectGetChildrenNodes,
	            BPObjectGetBrothers,
	            BPObjectAddChild,
	            BPObjectRemoveChild,
	            BPCreateAttachedPoint,
	            BPObjectAlwaysOnTop,
	            BPObjectSetPickable,
	            BPDestroyObject,
	            // BPObjectCollider,
	            BPQueryObjectByDistance,
	        ],
	        StyleNodes: [
	            BPObjectSetColor,
	            BPObjectCancelColor,
	            BPObjectSetOpacity,
	            BPObjectSetOutline,
	            BPObjectCancelOutline,
	            BPObjectSetEdge,
	            BPObjectSetFlash,
	            BPObjectSetVisible,
	            BPObjectSetColorFlash,
	            BPShowBoundingBox,
	            BPObjectSetGlow,
	            BPObjectSetWireframe,
	            BPObjectSetTexture,
	            BPObjectCancelTexture,
	            // BPObjectSetStyle,
	        ],
	        AttributeNodes: [
	            BPObjectGetAttribute,
	            BPObjectSetAttribute,
	            // BPObjectSetClippingPlanes,
	            BPLightSetIntensity,
	            BPLightSetAngle,
	            BPLightSetPenumbra,
	            BPLightSetDistance,
	            BPLightSetShadow,
	            // BPWaterSetFlowXSpeed,
	            // BPWaterSetFlowYSpeed,
	            // BPWaterSetFlowWeight,
	            // BPWaterSetNoiseTimeScale,
	            // BPSetClippingPlanesHeight

	        ],
	        AnimationNodes: [
	            BPObjectMoveTo,
	            // BPObjectMoveToOnAxis,
	            BPObjectMovePath,
	            BPObjectRotateTo,
	            BPObjectStopRotating,
	            BPObjectScaleTo,
	            BPObjectStopScaling,
	            BPObjectFadeIn,
	            BPObjectFadeOut,
	            BPObjectStopFading,
	            BPObjectPlayAnimation,
	            BPObjectStopAnimation,
	            BPObjectPauseAnimation,
	            BPObjectGetAnimations
	        ],
	        GeometryNodes: [
	            BPCreateBox,
	            BPCreateSphere,
	            BPCreateCylinder,
	            BPCreateCapsule,
	            BPCreateTorus,
	            BPCreatePoints,
	            BPCreateLine,
	            BPCreatePlane,
	            BPCreateCircle,
	            BPCreatePlaneRegion,
	            BPCreateExtrudeShape,
	        ],
	        TransformNodes: [
	            BPCreateSpace3D,
	            BPSpaceShowBounding,
	            BPSpaceIsContains,
	            BPSpaceIsIntersects,
	            BPSpaceIsDisjoint,
	            BPObjectGetPosition,
	            BPObjectSetPosition,
	            BPObjectGetPivot,
	            BPObjectSetPivot,
	            BPObjectGetRotation,
	            BPObjectSetRotation,
	            BPObjectGetScale,
	            BPObjectSetScale,
	            BPObjectTranslate,
	            BPObjectStopMoving,
	            // BPObjectTranslateOnAxis,
	            BPObjectRotateOnAxis,
	            // BPObjectRotateY,
	            BPObjectLookAt,
	            BPObjectShowAxes,
	            BPObjectSetTransformControl,
	            BPObjectCancelTransformControl,
	        ]
	    },
	    RelationshipNodes: [
	        BPCreateRelationShip,
	        BPDestroyRelationShip,
	        BPQueryObjectByRelationShip,
	        BPQueryRelationShip,
	    ],
	    LightNodes: [
	        BPSetAmbientLight,
	        BPSetMainLight,
	        BPCreateSpotLight,
	        BPCreateDirectionalLight
	    ],
	    CameraNodes: [
	        BPCameraFlyTo,
	        BPCameraStopFlying,
	        BPCameraFit,
	        BPCameraSetPosition,
	        BPCameraGetPosition,
	        BPCameraFollow,
	        BPCameraStopFollowing,
	        BPCameraSetProjection,
	        BPCameraSetFog,
	        BPCameraSetFov,
	        BPCameraSetViewMode,
	        BPAddCamera,
	        BPCameraRotateAround,
	        BPCameraStopRotating,
	        BPCameraPanControl,
	        BPCameraZoomControl,
	        BPCameraEnablePan,
	        BPCameraEnableRotate,
	        BPCameraEnableZoom,
	        BPCameraSetVertAngleLimit,
	        BPCameraSetHorzAngleLimit,
	    ],
	    EventNodes: [
	        BPBindMouseClickEvent,
	        BPUnbindMouseClickEvent,
	        BPPauseMouseClickEvent,

	        BPBindMouseDoubleClickEvent,
	        BPUnbindMouseDoubleClickEvent,
	        BPPauseMouseDoubleClickEvent,

	        BPBindMouseEnterEvent,
	        BPUnbindMouseEnterEvent,
	        BPBindMouseLeaveEvent,
	        BPUnbindMouseLeaveEvent,

	        BPBindMouseMoveEvent,
	        BPUnbindMouseMoveEvent,
	        BPPauseMouseMoveEvent,

	        BPBindMouseDragEvent,
	        BPBindAppEvent,
	        BPTriggerAppEvent,
	        BPEventNotifierNode,
	        BPEventTriggerNode,

	        BPBindObjectUpdateEvent,
	        BPUnbindObjectUpdateEvent,
	        BPPauseObjectUpdateEvent,

	        BPBindUpdateEvent,
	        BPUnbindUpdateEvent,
	        BPPauseUpdateEvent,

	        BPBindKeyboardEvent,
	        BPUnbindKeyboardEvent,
	        BPPauseKeyboardEvent,

	        BPEnterCampusLevelEvent,
	        BPEnterBuildingLevelEvent,
	        BPEnterFloorLevelEvent,
	        BPEnterRoomLevelEvent,
	        BPObjectCallFunction,
	    ],
	    InterfaceNodes: {
	        domNodes: [
	            BPCreateButton,
	            BPLayerButton,
	        ],
	        // widgetNodes: [
	        //     BPCreatePanel,
	        //     BPSetProgressBar,
	        //     BPSetSwitch,
	        //     BPSetRadio,
	        //     BPSetIframe,
	        //     BPSetStringData,
	        //     BPSetNumberData,
	        //     BPSetChecked
	        // ]
	    },
	    MarkerNodes: [
	        BPCreateMarker,
	        BPCreateTextLabel,
	    ],
	    EnvironmentNodes: [
	        BPSetBackgroundColor,
	        BPSetBackgroundImage,
	        BPSetSkyBox,
	    ],
	    VariableNodes: [
	        BPNumber,
	        BPString,
	        BPVector3,
	        BPVector2,
	        BPArray,
	        BPArrayNode,
	        BPAnyVarSetterNode,
	        BPAnyVarGetterNode
	    ],
	    WorkflowNodes: [
	        BPBranch,
	        BPSwitch,
	        BPIsEqual,
	        BPNumberCompare,
	        BPDelay,
	        BPTimer,
	        BPFlipFlop,
	        BPForLoop,
	        BPForEachLoop,
	    ],
	    UtilsNodes: [
	        BPRandomInteger,
	        BPRandomFloat,
	        BPRandomVector3Array,
	        BPRandomVector3,
	        BPRandomFromArray,
	        BPRandomColor,
	        BPVector3Add,
	        BPGetLastNumberStr,
	        BPGetElementFromArray,
	        BPArrayPushItem,
	        BPConvertAnyToVector3,
	        BPCreateCircleVector3Array,
	        BPStringAdd,
	        BPNumberMultiply,
	        BPNumberAdd,
	        BPNumberSubtract,
	        BPPickupColor,
	    ],
	    LogicNodes: [
	        BPIsExist,
	        BPIsContains,
	        BPIsEmpty,
	        BPIsObjectTag,
	    ],
	    PrefabNodes: [
	        // BPCreatePrefabObject,
	        // BPBatchCreatePrefabObject,
	    ],
	    UENodes: [
	        //ue blueprint node placeholder : do not remove this line , ue blueprint node generator would insert nodes at here procedurally.
	        //@export_insert
	    ],
	};

	class BPBindGlobalMouseEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindGlobalMouseEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            // {
	            //     name: 'object',
	            //     type: 'any',
	            // },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	            },

	        ],
	    }

	    constructor() {
	        super();

	        this._object = null;
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._event = inputs['event'] || 'click';
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._app = THING.App.current;

	        let _eventObject = new THING.Selector();
	        this._app.on(this._event, (ev) => {
	            _eventObject.clear();
	            _eventObject.push(ev.object);
	            outputs['object'] = _eventObject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            this.run('callback', outputs);
	        }, this._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this._app.off(this._event, this._tag);
	    }
	}

	class BPUnbindGlobalMouseEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindGlobalMouseEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	        ],
	    }

	    constructor() {
	        super();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._event = inputs['event'] || 'click';
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._app = this.app;
	        this._app.off(this._event, this._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	    }
	}

	class BPUpdateEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUpdateEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            }
	        ],
	    }

	    constructor() {
	        super();

	        this._object = null;
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._object = inputs['object'];

	        if (!this._object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        let that = this;
	        let _updateObject = new THING.Selector();
	        this._object.on('update', function (ev) {
	            _updateObject.clear();
	            _updateObject.push(ev.object);
	            outputs['object'] = _updateObject;
	            that.run('callback', outputs);
	        }, that._tag);

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object) {
	            this._object.off('update', this._tag);
	        }
	    }

	}

	class BPKeyboardEvent extends BaseNode3D {
	    static config = {
	        name: 'BPKeyboardEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['keydown', 'keypress', 'keyup']
	            },
	            {
	                name: 'keyCode',
	                type: 'number',
	                visiblePin: false
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'keyCode',
	                type: 'number',
	            },

	        ],
	    }

	    constructor() {
	        super();

	        this._object = null;
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._event = inputs['event'] || 'keydown';
	        this._tag = inputs['tag'] || 'defaultTag';
	        this._keyCode = inputs['keyCode'] || 'allKeyCode';
	        this._object = inputs['object'];

	        if (!this._object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }
	        let that = this;
	        let _object = new THING.Selector();
	        function handleEvent(ev) {
	            if (that._keyCode == ev.keyCode || that._keyCode == 'allKeyCode') {
	                _object.clear();
	                _object.push(ev.object);
	                outputs['keyCode'] = ev.keyCode;
	                outputs['object'] = _object;
	                that.run('callback', outputs);
	            }
	        }
	        this._object.on(that._event, function (ev) {
	            handleEvent(ev);
	        }, that._tag);
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        const that = this;
	        if (this._object) {
	            this._object.off(that._event, that._tag);
	        }
	    }
	}

	class BPFlyTo extends BaseNode3D {
	  static config = {
	    name: 'BPFlyTo',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'target',
	      type: 'selector',
	    },
	    {
	      name: 'position',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'time',
	      type: 'number',
	      value: 1
	    },
	    {
	      name: 'delayTime',
	      type: 'number',
	      value: 0
	    }
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'complete',
	        type: 'callback',
	      }
	    ],
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _target = inputs['target'] || [0, 0, 0];
	    let position = inputs['position'] || [0, 0, 0];
	    let time = handleTime(inputs['time']);
	    let delayTime = inputs['delayTime'] * 1000 || 0;
	    let app = THING.App.current;
	    let that = this;
	    if (_target.isSelector && _target.length > 0) {
	      _target = _target[0];
	    }
	    app.camera.flyToAsync({
	      target: _target,
	      position: position,
	      time: time,
	      delayTime: delayTime,
	      complete: () => {
	        that.run('complete', outputs);
	      }
	    });
	    function handleTime(time) {
	      let reg = /^\d+(\.\d+)?$/;
	      if (reg.test(time)) {
	        return time * 1000;
	      } else {
	        return 0;
	      }
	    }
	  }
	}

	class BPStopFlying extends BaseNode3D {
	  static config = {
	    name: 'BPStopFlying',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      }
	    ],
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let app = this.app;
	    app.camera.stopFlying();
	  }
	}

	class BPUnbindMouseEvent extends BaseNode3D {
	    static config = {
	        name: 'BPUnbindMouseEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let _event = inputs['event'] || 'click';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _object = inputs['object'];

	        if (!_object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }
	        _object.off(_event, _tag);
	        outputs['object'] = _object;
	    }
	}

	class BPBindMouseEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindMouseEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	                advanced: true
	            },
	        ],
	        outputs: [
	            {
	                name: 'callback',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'pickedPosition',
	                type: 'vector3',
	            },

	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        let defaultTag = this.getDefaultTag();
	        this._event = inputs['event'] || 'click';
	        this._tag = inputs['tag'] || defaultTag;
	        this._object = inputs['object'];

	        if (!this._object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        let that = this;

	        let eventObject = new THING.Selector();
	        // 判断如果是数组，则循环执行
	        this._object.on(that._event, function (ev) {
	            eventObject.clear();
	            eventObject.push(ev.object);
	            outputs['object'] = eventObject;
	            outputs['pickedPosition'] = ev.pickedPosition;
	            that.run('callback', outputs);
	        }, that._tag);

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object) {
	            this._object.off(this._event, this._tag);
	        }

	    }

	}

	class BPPauseMouseEvent extends BaseNode3D {
	    static config = {
	        name: 'BPPauseMouseEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	            {
	                name: 'event',
	                type: 'select',
	                value: ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave']
	            },
	            {
	                name: 'tag',
	                type: 'string',
	            },
	            {
	                name: 'pause',
	                type: 'boolean',
	                value: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        let _event = inputs['event'] || 'click';
	        let _tag = inputs['tag'] || 'defaultTag';
	        let _pause = inputs['pause'];
	        let _object = inputs['object'];

	        if (!_object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        if (_pause) {
	            _object.pauseEvent(_event, _tag);
	        } else {
	            _object.resumeEvent(_event, _tag);
	        }

	        outputs['object'] = _object;
	    }
	}

	class BPBindClickEvent extends BaseNode3D {
	    static config = {
	        name: 'BPBindClickEvent',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	        outputs: [
	            {
	                name: 'click',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }

	    constructor() {
	        super();

	        this._object = new THING.Selector();
	        this._event = 'click';
	        this._clickObject = new THING.Selector();
	    }

	    // 当蓝图运行时被调用
	    onExecute(data, inputs, outputs) {
	        this._object = inputs['object'];

	        if (!this._object) {
	            console.error('没有找到绑定事件的对象');
	            return
	        }

	        let that = this;
	        that._object.on(that._event, function (ev) {
	            that._clickObject.clear();
	            that._clickObject.push(ev.object);
	            outputs['object'] = that._clickObject;
	            that.run('click', outputs);
	        }, 'defaultTag');

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._object) {
	            this._object.off(this._event, 'defaultTag');
	            this._clickObject.clear();
	        }
	    }

	}

	class BPPlayAudio extends BaseNode3D {
	    static config = {
	        name: 'BPPlayAudio',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'url',
	                type: 'string',
	            },
	            {
	                name: 'id',
	                type: 'string',
	                advanced: true
	            },
	            {
	                name: 'x',
	                type: 'number',
	                advanced: true
	            },
	            {
	                name: 'y',
	                type: 'number',
	                advanced: true
	            },
	            {
	                name: 'control',
	                type: 'boolean',
	                value: true,
	                advanced: true
	            },
	            {
	                name: 'loop',
	                type: 'boolean',
	                value: false,
	                advanced: true
	            },
	            {
	                name: 'autoplay',
	                type: 'boolean',
	                value: true,
	                advanced: true
	            }
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'interface',
	                type: 'object',
	                advanced: true
	            }
	        ],
	    }
	    constructor() {
	        super();
	    }
	    onExecute(data, inputs, outputs) {
	        const x = inputs['x'] || 10;
	        const y = inputs['y'] || 10;
	        let {
	            url,
	            id,
	            control,
	            loop,
	            autoplay,
	        } = inputs;
	        let dirX = 'left';
	        let dirY = 'top';
	        if (x < 0) {
	            dirX = 'right';
	            x = -x;
	        }
	        if (y < 0) {
	            dirY = 'bottom';
	            y = -y;
	        }

	        if (url) {
	            super.validNodeUserInterface();
	            //创建按钮dom

	            const nodeParent = document.getElementById('uino-container-ui');

	            function createDocument(template, className) {
	                let doc = new DOMParser().parseFromString(template, 'text/html');
	                let domObject = doc.querySelector(`.${className}`);
	                return domObject;
	            }

	            let audio = `<audio class = "thingAudio"
                style="position:absolute;${dirX}:${x};${dirY}:${y};pointer-events:all;" >
                <source src=${url}>
                </audio>`;

	            if (this._audio) {
	                this._audio.remove();
	            }
	            this._audio = createDocument(audio, 'thingAudio');

	            if (id) {
	                let isExisted = document.getElementById(id);
	                if (isExisted) {
	                    isExisted.remove();
	                }
	                this._audio.id = id;
	            }
	            if (control) {
	                this._audio.controls = 'controls';
	            }
	            if (loop) {
	                this._audio.loop = 'loop';
	            }
	            if (autoplay) {
	                this._audio.autoplay = 'autoplay';
	            }

	            nodeParent.appendChild(this._audio);

	            outputs['interface'] = this._audio;
	        }

	    }


	    // 当蓝图停止时被调用
	    onStop() {
	        if (this._audio) {
	            this._audio.remove();
	        }
	        super.recycleNodeUserInterface();
	    }

	}

	class BPLoadScene extends BaseNode3D {
	    static config = {
	        name: 'BPLoadScene',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'url',
	                type: 'string',
	                value: './resource/bluePrint/models/factory'
	            },
	            {
	                name: 'enterLevel',
	                type: 'boolean',
	            },
	            {
	                name: 'ignoreTheme',
	                type: 'boolean',
	                advanced: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this.bundle = null;
	        this._selector = new THING.Selector();
	    }

	    onExecute(data, inputs, outputs) {
	        const url = inputs['url'];
	        const enterLevel = inputs['enterLevel'];
	        let app = this.app;
	        var bundle = app.loadBundle(url, {
	            // ignoreTheme: inputs['ignoreTheme']
	            ignoreTheme: false //是否忽略科幻
	        });
	        this.bundle = bundle;
	        let that = this;
	        bundle.waitForComplete().then(() => {
	            this.root = bundle.campuses[0];

	            if (enterLevel) {
	                this.app.level.change(this.root, {
	                    onComplete: () => {
	                        that._selector.push(bundle.campuses[0]);
	                        that.run('complete', {
	                            object: that._selector
	                        });
	                    }
	                });
	            }
	            else {
	                that._selector.push(bundle.campuses[0]);
	                that.run('complete', {
	                    object: that._selector
	                });
	            }

	        });

	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        let app = this.app;

	        if (this.root) {
	            this.root.destroy();
	            this.root = null;
	        } else {
	            app.query('.Campus')[0].destroy();
	        }
	        if (app.root.hasComponent('renderSetting')) {
	            app.root.removeComponent("renderSetting");
	        }
	        this._selector.clear();
	    }

	}

	class BPLoadGltf extends BaseNode3D {
	    static config = {
	        name: 'BPLoadGltf',
	        group: 'Custom',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec',
	            },
	            {
	                name: 'url',
	                type: 'string',
	                value: './resource/scene/gltfScene/Thing.gltf'
	            },
	            {
	                name: 'enterLevel',
	                type: 'boolean',
	            },
	            {
	                name: 'ignoreTheme',
	                type: 'boolean',
	                advanced: true,
	            },
	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec',
	            },
	            {
	                name: 'complete',
	                type: 'callback',
	            },
	            {
	                name: 'object',
	                type: 'selector',
	            },
	        ],
	    }
	    constructor() {
	        super();
	        this._selector = new THING.Selector();
	    }
	    onExecute(data, inputs, outputs) {
	        const url = inputs['url'];
	        const enterLevel = inputs['enterLevel'];
	        const campus = new THING.Campus({
	            url: url,
	        });
	        campus.waitForComplete().then(() => {
	            if (enterLevel) {
	                this.app.level.change(campus, {
	                    onComplete: () => {
	                        this._selector.push(campus);
	                        outputs['object'] = this._selector;
	                        this.run('complete', outputs);
	                    }
	                });
	            }
	            else {
	                this._selector.push(campus);
	                outputs['object'] = this._selector;
	                this.run('complete', outputs);
	            }
	        });
	    }

	    // 当蓝图停止时被调用
	    onStop() {
	        this._selector.destroy();
	        this._selector.clear();
	    }

	}

	class BPGetCameraPosition extends BaseNode3D {
	  static config = {
	    name: 'BPGetCameraPosition',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	      {
	        name: 'position',
	        type: 'vector3',
	      },
	      {
	        name: 'target',
	        type: 'vector3',
	      },
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let app = this.app;
	    outputs['position'] = app.camera.position;
	    outputs['target'] = app.camera.target;
	  }
	}

	class BPSetCameraPosition extends BaseNode3D {
	  static config = {
	    name: 'BPSetCameraPosition',
	    inputs: [{
	      name: 'exec',
	      type: 'exec'
	    },
	    {
	      name: 'position',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    {
	      name: 'target',
	      type: 'vector3',
	      value: [0, 0, 0]
	    },
	    ],
	    outputs: [
	      {
	        name: 'exec',
	        type: 'exec'
	      },
	    ]
	  }
	  constructor() {
	    super();
	  }
	  onExecute(data, inputs, outputs) {
	    let _position = inputs['position'] || [0, 0, 0];
	    let _target = inputs['target'] || [0, 0, 0];
	    let app = this.app;
	    //获取当前摄像机位置
	    this.position = app.camera.position;
	    this.target = app.camera.target;

	    app.camera.position = _position;
	    app.camera.target = _target;
	  }
	  onStop() {
	    this.app.camera.position = this.position;
	    this.app.camera.target = this.target;
	  }
	}

	class BPFuzzyQueryObject extends BaseNode3D {
	  static config = {
	    name: 'BPFuzzyQueryObject',
	    inputs: [
	      {
	        name: 'exec',
	        type: 'exec',
	      },
	      {
	        name: 'name',
	        type: 'string',
	      },
	      {
	        name: 'object',
	        type: 'selector',
	        advanced: true
	      },
	      {
	        name: 'containsChild',
	        type: 'boolean',
	        value: true,
	        advanced: true
	      },
	    ],
	    outputs: [
	      {
	        name: 'next',
	        type: 'exec',
	      },
	      {
	        name: 'allResult',
	        type: 'selector',
	      },
	    ],
	  }
	  // 当蓝图运行时被调用
	  onExecute(data, inputs, outputs) {
	    let _name = inputs['name'];
	    let _containsChild = inputs['containsChild'];
	    let _object = inputs['object'];
	    let result = [];
	    if (_object && _object.length > 0) {
	      _object = _object[0];
	    }
	    let _parent = _object || this.app;
	    if (_name) {
	      let reg = new RegExp(_name);
	      result = _parent.query(reg, { recursive: _containsChild });
	    }
	    outputs['allResult'] = result;
	  }

	  // 当蓝图停止时被调用
	  onStop() {
	  }

	}

	class BPSetCameraFov extends BaseNode3D {
	    static config = {
	        name: 'BPSetCameraFov',
	        inputs: [
	            {
	                name: 'exec',
	                type: 'exec'
	            },
	            {
	                name: 'fov',
	                type: 'number',
	                value: 50
	            }

	        ],
	        outputs: [
	            {
	                name: 'next',
	                type: 'exec'
	            }
	        ]
	    };

	    constructor() {
	        super();
	    }

	    onExecute(data, inputs, outputs) {
	        this.oldFov = this.app.camera.fov;
	        let fov = inputs['fov'];
	        this.app.camera.fov = fov;
	    }

	    onStop() {
	        if (this.oldFov) {
	            this.app.camera.fov = this.oldFov;
	        }
	    }

	}

	const {
	    BeginNode,
	    TickNode, ArrayNode, SequenceNode } = THING.BLUEPRINT;

	var BPLegacyNodes = {
	    legacy: [
	        BPUpdateEvent,
	        BPKeyboardEvent,
	        BPFlyTo,
	        BPStopFlying,
	        BPBindGlobalMouseEvent,
	        BPUnbindGlobalMouseEvent,
	        BPUnbindMouseEvent,
	        BPBindMouseEvent,
	        BPPauseMouseEvent,
	        BPBindClickEvent,
	        BPPlayAudio,
	        BPLoadScene,
	        BPLoadGltf,
	        BPGetCameraPosition,
	        BPSetCameraPosition,
	        BPFuzzyQueryObject,
	        BPSetCameraFov,
	        BeginNode,
	        TickNode,
	        ArrayNode,
	        SequenceNode
	    ],
	};

	const allNodes = Object.assign({}, BPNodes, BPLegacyNodes);

	function registerNodes() {
	    traversalNodes(allNodes, function (nodes) {
	        nodes.forEach((nodeClass) => {
	            THING.BLUEPRINT.Utils.registerBlueprintNode(nodeClass);
	        });
	    });
	}

	function traversalNodes(nodes, func) {
	    Object.keys(nodes).forEach((key) => {
	        if (!(nodes[key] instanceof Array)) {
	            traversalNodes(nodes[key], func);
	        } else {
	            if (typeof func === 'function')
	                func(nodes[key]);
	        }
	    });
	}
	registerNodes();

	THING.BLUEPRINT.NODES = {};
	THING.BLUEPRINT.NODES.VERSION = "0.1.0";
	THING.BLUEPRINT.NODES.BPNodes = BPNodes;
	THING.BLUEPRINT.NODES.BPLegacyNodes = BPLegacyNodes;

}));
