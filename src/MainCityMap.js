// 纯地图，默认这里只有地表。依靠BuildingLayer我们把建筑底座迁移过来。挂成地图的子节点。
var MainCityMap = cc.Layer.extend({
	m_mapSize:null,
	m_nodeBuildMenu:null,
	buildingNodes:{}, 		// 可以按照位置索引
	buildingNodeList:null, 	// 数组, 按照Y值排序，存在遮盖关系
	ctor:function () {
		this._super();
		JoyE.uiloader.load(this, res.MainCityMapLayer_json);
		var nodeBuildings = new cc.Node();
		JoyE.uiloader.load(nodeBuildings, res.BuildingLayer_json);
		this.sentryNode = new cc.Node();
		this.sentryNode.setPosition(1070, 1930);
		this.addChild(this.sentryNode,10000);

		JoyE.uiloader.load(this.sentryNode, res.Soldier_json);
		this.m_mapSize = this.rootNode.getContentSize();
		// MainCityMapLayer 的坐标原点就是地图的中心点，所以以后对MainCityMapLayer调用setPosition就是把地图中心移动到某个位置
		//this.rootNode.setPosition(-this.m_mapSize.width / 2, -this.m_mapSize.height / 2);
		this.setContentSize(0, 0);
		this.m_particle.visible = false;

		this.buildingNodeList = []; //继承时候的 初始化有问题，需要在这里再次初始化

		// 遍历建筑，这里检测下，它们存在么？位置在哪里？默认1号建筑就是大本营，其他的从2开始都是功能建筑
		for(var i = 1; i < 1000; ++i) {
			if(nodeBuildings["m_building_" + i] != undefined) {
				//cc.log("m_building_" + i);
				var theNode = nodeBuildings["m_building_" + i];
				theNode.removeFromParent();
				theNode.setTouchEnabled(false);
				if(cc.sys.isNative){
					theNode.setTitleText("");
				} else {
					theNode.setTitleText(i);
					theNode.setTitleFontSize(32);
					var fontColor = new cc.Color(255, 255, 0, 255);
					theNode.setTitleColor(fontColor);
				}
				theNode.m_size = theNode.getContentSize();
				theNode.m_pos = i;
				// y 越大 z 应该越小，才能达到正确的覆盖关系
				var zOrder = this.m_mapSize.height - theNode.y;
				if(i == 6) {
					zOrder = JoyE.dialogManager.baseZOrder;
				}
				this.addChild(theNode, zOrder, theNode.getTag());
				this.buildingNodes["m_building_" + i] = theNode;
				this.buildingNodeList.push(theNode);
				if(ww3logic.building.positiondefine == null || i == 4 | i == 5 || i == 18) {
					theNode.visible = false;
				} else {
					var positionStatus = ww3logic.building.positiondefine[i];
					if(positionStatus == null) {
						// 没有这个地块或者这个地方还没解锁
						theNode.visible = false;
					} else {
						//建筑底座，在地图上定位，以及玩家点击建造建筑，完全就靠它了
						theNode.visible = true;
					}
				}
			}
			if(i < 5 && nodeBuildings["m_tree" + i] != undefined) {
				//cc.log("m_tree" + i);
				var theNode = nodeBuildings["m_tree" + i];
				var pid = 115 + (i - 1) * 5 + 1;
				if(ww3logic.building.positiondefine[pid] != null) {
					// 区域已经开放，锁定区域的小玩意就无需留下了，继续循环吧
					continue;
				}
				if(ww3logic.building.positionlockdefine != null) {
					var locked = ww3logic.building.positionlockdefine[i + 99];
					theNode.m_levelTxt.setString(locked.lv);
				}
				// y 越大 z 应该越小，才能达到正确的覆盖关系
				theNode.removeFromParent();
				theNode.m_treeIndex = i;
				var zOrder = this.m_mapSize.height - theNode.y;
				this.addChild(theNode, zOrder, theNode.getTag());
				this.buildingNodes["m_tree" + i] = theNode;
				//
				var locChildren = theNode.getChildren();
				for (var ci = 0; ci < locChildren.length; ci++) {
					var child = locChildren[ci];
					if(child.setTouchEnabled) {
						child.setTouchEnabled(false);
					}
				}
			}
		}
		// 按照覆盖关系排序
		this.buildingNodeList.sort(function(a,b){return a.y > b.y ? 1 : -1;});
		nodeBuildings = null;
		// 服务器下推的数据解析，把它们显示出来
		var buildingData = JoyE.Tutorial.isEnabled?JoyE.Tutorial.buildingData : JoyE.buildingManager.buildingData;
		for(var pid in buildingData) {
			// TODO: 把它建造出来吧！
			var bid = buildingData[pid];
			if(bid != null && Number(bid) < 1000) {
				// 空位置
				continue;
			}
			var level = bid % 1000;
			bid = bid - level;
			if(Number(level) < 1) {
				level = 1;
			}
			cc.log("第" + pid + "号位置是建筑" + bid + ", 当前等级" + level);
			var theNode = this.buildingNodes["m_building_" + pid];
			if(theNode == null) {
				continue;
			}
			JoyE.uiloader.load(theNode, res["Build_" + bid + "_json"]);
			theNode.rootNode.setAnchorPoint(0, 0);
			theNode.m_levelTxt.setString(level);
			theNode.m_nBuildLevel = level;
			theNode.m_buildId = bid;
			if(theNode.m_z){
				JoyE.queueManager.setZ(theNode,true);
			}
		}
		// 指挥中心存在否？不存在的话就建造一个出来
		var theNode = this.buildingNodes["m_building_1"];
		if(theNode.rootNode == undefined) {
			JoyE.uiloader.load(theNode, res["Build_400000_json"]);
			theNode.rootNode.setAnchorPoint(0, 0);
			theNode.m_levelTxt.setString("1");
			theNode.m_nBuildLevel = 1;
			theNode.m_buildId = 400000;
		}
	},

	setPosition:function(newPosOrxValue, yValue){
		//坐标取整
		if(yValue === undefined){
			this.logicPos = cc.p(newPosOrxValue.x,newPosOrxValue.y);
			var targetPos = cc.p(Math.round(this.logicPos.x),Math.round(this.logicPos.y));
			this._super(targetPos);
		}else{
			this.logicPos = cc.p(newPosOrxValue,yValue);
			var targetPos = cc.p(Math.round(this.logicPos.x),Math.round(this.logicPos.y));
			this._super(targetPos);
		}
	},


	getPosition:function(){
		return this.logicPos;
	},

	playLevelupParticle: function(pid) {
		var theNode = this.buildingNodes["m_building_" + pid];
		if(theNode == null) {
			return;
		}
		if(theNode.m_upEffectNode == null) {
			theNode.m_upEffectNode = new cc.Node();
			if(pid > 1 && theNode.m_buildTile != null) {
				var size = theNode.m_buildTile.getContentSize();
				theNode.m_upEffectNode.setPosition(size.width * 0.5, size.height * 0.5);
			} else if(theNode.m_pic != null) {
				var size = theNode.m_pic.getContentSize();
				theNode.m_upEffectNode.setPosition(size.width * 0.5, size.height * 0.25);
			}
			theNode.addChild(theNode.m_upEffectNode);
		} else {
			theNode.m_upEffectNode.removeAllChildren();
		}
		if (pid == 1) {
			var ptArray = [];
			ptArray.push(cc.p(-140, 130));
			ptArray.push(cc.p(0, 300));
			ptArray.push(cc.p(100, 150));
			for (var j = 0; j < ptArray.length; ++j) {
				for (var i = 1; i < 5; ++i) {
					var particle = new cc.ParticleSystem(res["Fireworks_" + i]);
					particle.setPosition(ptArray[j]);
					theNode.m_upEffectNode.addChild(particle);
				}
			}
		}
		var pName = "levelup_1_";
		var count = 9;
		if(pid > 100) {
			pName = "levelup_2_";
			count = 8;
		}
		for (var i = 1; i < count; ++i) {
			var particle = new cc.ParticleSystem(res[pName + i]);
			particle.setPosition(cc.p(0, 0));
			theNode.m_upEffectNode.addChild(particle);
		}
	},
	unlockArea : function(pid) {
		// 解锁地块: 去lockdefine里面找，看这个pid是属于哪个地块，然后把这个地块打开
		for(var i = 1; i < 5; i++) {
			var theAreaNode = this.buildingNodes["m_tree" + i];
			var locked = ww3logic.building.positionlockdefine[i + 99];
			for(var index in locked.position) {
				if(pid == locked.position[index]) {
					var theNode = this.buildingNodes["m_building_" + pid];
					if(theNode != null) {
						theNode.visible = true;
					}
					theAreaNode.visible = false;
					if(pid % 5 == 0) {
						//JoyE.Viewport.showMsgTip("地块解锁成功");
					}
					return;
				}
			}
		}
	},
	getMapSize:function() {
		return this.m_mapSize;
	},
	existNodeAtIndex:function(index) {
		return (this.buildingNodes["m_building_" + index] != undefined);
	},
	getBuildNodeByIndex:function(index) {
		var theNode = this.buildingNodes["m_building_" + index];
		return theNode;
	},
	getMaxLevelByType:function(bid) {
		var level = 0;
		bid = bid - (bid % 1000);
		this.buildingNodeList.forEach(function (theNode, index) {
			if(theNode.rootNode != null) {
				if(theNode.m_buildId == bid) {
					level = Math.max(level, theNode.m_nBuildLevel);
				}
			}
		});
		return level;
	},
	forEach:function(callback) {
		this.buildingNodeList.forEach(function (node, index) {
			callback(node);
		});
	},
	getLockAreaGuideInfo:function() {
		var ret = {pid:1, node:null};
		for(var i = 1; i < 5; i++) {
			var theAreaNode = this.buildingNodes["m_tree" + i];
			if(theAreaNode != null && theAreaNode.isVisible()) {
				var locked = ww3logic.building.positionlockdefine[i + 99];
				ret = {pid:locked.position[0], node:theAreaNode};
				break;
			}
		}
		return ret;
	},
	tryUnlockArea : function(i, theAreaNode) {
		var locked = ww3logic.building.positionlockdefine[i + 99];
		var level = JoyE.playerData.getMainBuildLevel();
		if(level < locked.lv) {
			JoyE.Viewport.showMsgTip(LanguageUtil.getText("areaUnlockTip1", locked.lv));
			return;
		}
		JoyE.dialogManager.showDialog(new DetailedDialog(locked.id, theAreaNode));
	},
	onClick:function(touchPosAtScreen) {
		// 场景点击事件
		this.hideBuildMenu();
		var now = (new Date()).getTime();
		if(this.lastClickTime != null && now - this.lastClickTime < 100) {
			// 两次点击时间间隔太短，别是乱抓吧？属猴的？回去！
			return;
		}
		this.lastClickTime = now;
		var clickOnNode = this.hitUI(touchPosAtScreen);
		if(clickOnNode != null) {
			if(clickOnNode.m_treeIndex == null) {
				if((JoyE.queueManager.currentBuilding == clickOnNode || JoyE.queueManager.currentBuildingGold == clickOnNode)
						&& clickOnNode.m_tipFreeNode != null
						&& clickOnNode.m_tipFreeNode.isVisible()) {
					ww3logic.building.done(clickOnNode.m_pos);
				} else {
					JoyE.buildingManager.onClick(clickOnNode);
				}
			} else {
				this.tryUnlockArea(clickOnNode.m_treeIndex, clickOnNode);
			}
			return true;
		}

		var pt = new cc.ParticleSystem(res.Pt_glick_ground_plist);
		pt.setPositionType(cc.ParticleSystem.TYPE_GROUPED);
		pt.setAutoRemoveOnFinish(true);
		var clickPos = this.convertToNodeSpace(touchPosAtScreen);
		pt.setPosition(clickPos);
		pt.setScale(1/this.getScale());
		this.addChild(pt,65535);

		cc.audioEngine.playEffect(res.touch_mp3, false);
		JoyE.Viewport.addDebugLog("playEffect: res.touch_mp3");

		return false;
	},
	hitUI:function(touchPosAtScreen) {
		var clickPos = this.convertToNodeSpace(touchPosAtScreen);
		cc.log("ClickAt:", Math.floor(clickPos.x), Math.floor(clickPos.y));
		// 循环，判断是不是点中了某个建筑
		var isTouchOnBuild = null;
		this.buildingNodeList.forEach(function(theNode, index) {
			if(isTouchOnBuild != null || !theNode.isVisible() || (ww3logic.building.positiondefine[theNode.m_pos] == null)) {
				return;
			}
			var collectBtn = theNode.m_collectBtn;// 收集资源或者收取士兵按钮
			if(collectBtn != undefined && collectBtn.isVisible() ) {
				var locChildren = collectBtn.getChildren();
				for (var i = 0; i < locChildren.length; i++) {
					var child = locChildren[i];
					var size = child.getContentSize();
					var bb = cc.rect(0, 0, size.width, size.height);
					if(cc.rectContainsPoint(bb, child.convertToNodeSpace(touchPosAtScreen))) {
						isTouchOnBuild = theNode;
						break;
					}
				}
			}
			if(!isTouchOnBuild && theNode.m_tipFreeNode != null
					&& theNode.m_tipFreeNode.m_touchNode != null
					&& theNode.m_tipFreeNode.m_touchNode.hitTest(touchPosAtScreen)) {
				isTouchOnBuild = theNode;
			}
			if(!isTouchOnBuild && theNode.hitTest(touchPosAtScreen)) {
				isTouchOnBuild = theNode;
			}
			if(!isTouchOnBuild && theNode.rootNode && theNode.rootNode.m_pic && theNode.m_pos != 6) {
				var size = theNode.rootNode.m_pic.getContentSize();
				var bb = cc.rect(0, 0, size.width, size.height);
				var pos = theNode.rootNode.m_pic.convertToNodeSpace(touchPosAtScreen);
				var posTile = theNode.rootNode.m_buildTile.convertToNodeSpace(touchPosAtScreen);
				if(posTile.x >= 0 && cc.rectContainsPoint(bb, pos)) {
					isTouchOnBuild = theNode;
				}
			}
		});
		var theNode = this.buildingNodes["m_building_6"];
		if(!isTouchOnBuild && theNode && theNode.m_pos == 6) {
			if(theNode.m_touchNode1 != null && theNode.m_touchNode1.hitTest(touchPosAtScreen)) {
				isTouchOnBuild = theNode;
			} else if(theNode.m_touchNode2 != null && theNode.m_touchNode2.hitTest(touchPosAtScreen)) {
				isTouchOnBuild = theNode;
			} else if(theNode.m_touchNode3 != null && theNode.m_touchNode3.hitTest(touchPosAtScreen)) {
				isTouchOnBuild = theNode;
			} else if(theNode.m_touchNode4 != null && theNode.m_touchNode4.hitTest(touchPosAtScreen)) {
				isTouchOnBuild = theNode;
			}
		}
		if(!isTouchOnBuild) {
			// 最后判断是不是点在了草地上
			for(var i = 1; i < 5; i++) {
				var theAreaNode = this.buildingNodes["m_tree" + i];
				if(theAreaNode != null && theAreaNode.isVisible() && theAreaNode.hitTest(touchPosAtScreen)) {
					isTouchOnBuild = theAreaNode;
					break;
				}
			}
		}
		return isTouchOnBuild;
	},
	//################################################################################
	showBuildMenu:function(building) {
		if(this.m_nodeBuildMenu == null) {
			this.m_nodeBuildMenu = new BuildMenu();
			this.addChild(this.m_nodeBuildMenu, 0);
		}
		this.m_nodeBuildMenu.init(building);
		JoyE.Viewport.hideGuideArraw(building);
	},
	hideBuildMenu:function(immediately) {
		if(this.m_nodeBuildMenu != null) {
			this.m_nodeBuildMenu.fadeout(immediately);
		}
	},

	playSentryAnimation:function(count) {

		var animList = [];
		var actionTo = cc.moveTo(5, cc.p(980,1975));
		var actionByBack = cc.moveTo(5, cc.p(1070, 1930));

		//for(var i = 0; i < count; i++){
		//	this.sentryNode = new cc.Node();
		//	var posNew = JoyE.soldier["pathpoint" + i];
		//	var posRec = JoyE.soldier["pathpoint" + (i+1)];
		//	this.sentryNode.setPosition(posNew);
		//	this.addChild(this.sentryNode,10000);
		//	var rootNodeInner = this.sentryNode.rootNode;
        //
		//	var actionTo = cc.moveTo(5, posRec);
		//	var actionByBack = cc.moveTo(5, posNew);
		//	animList.push(new cc.CallFunc(function() {JoyE.playAnimation(rootNodeInner, "animation0", true)}));
		//	animList.push(actionTo);
		//	animList.push(new cc.CallFunc(function() {JoyE.playAnimation(rootNodeInner, "animation1", true)}));
		//	animList.push(actionByBack);
		//	this.sentryNode.runAction(cc.sequence(animList).repeatForever());
		//}

		var rootNodeInner = this.sentryNode.rootNode;
		animList.push(new cc.CallFunc(function() {JoyE.playAnimation(rootNodeInner, "animation0", true)}));
		animList.push(actionTo);
		animList.push(new cc.CallFunc(function() {JoyE.playAnimation(rootNodeInner, "animation1", true)}));
		animList.push(actionByBack);
		this.sentryNode.runAction(cc.sequence(animList).repeatForever());
	},
	onEnter:function(){
		this._super();
		this.playSentryAnimation();
	},
	onExit:function() {
		this._super();
	}

});



