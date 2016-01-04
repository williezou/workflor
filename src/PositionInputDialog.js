
var PositionInputDialog = MessageBox.extend({
	srcPosX:null,
	srcPosY:null,
	m_inputX:null,
	m_inputY:null,
	ctor:function (argument) {
		this._super(LanguageUtil.texts["inputPos"]);
		cc.spriteFrameCache.addSpriteFrames(res.World_UI_plist);
		JoyE.uiloader.load(this, res.Dialog_PositionInput_json);
		this.addLayout(this.m_layout);

		//this.m_inputX.setString(this.srcPosX);
		//this.m_inputY.setString(this.srcPosY);
		this.m_inputX.setString(JoyE.Viewport.m_worldMapUI.currMapPos.x);
		this.m_inputY.setString(JoyE.Viewport.m_worldMapUI.currMapPos.y);

		this.m_inputX.setInputMode(cc.EDITBOX_INPUT_MODE_NUMERIC);
		this.m_inputX.setReturnType(cc.KEYBOARD_RETURNTYPE_DONE);
        //this.m_inputX.setDelegate(this);
		ww3logic.event.addEventListener(this.textFieldEvent, this);

		this.m_inputY.setInputMode(cc.EDITBOX_INPUT_MODE_NUMERIC);
		this.m_inputY.setReturnType(cc.KEYBOARD_RETURNTYPE_DONE);
        //this.m_inputY.setDelegate(this);
		
		this.m_text_X.setString("X:");
		this.m_text_Y.setString("Y:");
	},
	textFieldEvent: function(textField, type){
		if(type == ccui.TextField.EVENT_DETACH_WITH_IME)
			this.m_inputX.setString("");
	},

	//editBoxEditingDidBegin:function(textNode) {
	//	 this.m_inputX.setString("");
	//	 this.m_inputY.setString("");
	//},
    //
	//editBoxEditingDidEnd:function(textNode){
	//	this.srcPosX = Number(this.m_inputX.string);
	//	this.srcPosY = Number(this.m_inputY.string);
	//},

	onBtngoClick: function() {
		this.srcPosX = Number(this.m_inputX.string);
		this.srcPosY = Number(this.m_inputY.string);
		if (this.m_inputX.string == "" || this.m_inputY.string == "") {
			JoyE.Viewport.showMsgTip(LanguageUtil.getText("pleaseInputPos"));
			return;
		} else {
			JoyE.Viewport.switchToMapPos({x: this.srcPosX, y: this.srcPosY});
			this.close();
		}
	}
});