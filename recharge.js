var RechargeDialog = JoyE.BaseDialog.extend({

    fuckedScrollView:null,
    pageIdx:0,
    pages:0,

    ctor:function(){
        this._super();

        JoyE.imageManager.addImageCache(this, res.Common_4_plist);
        JoyE.uiloader.load(this, res.Dialog_RechargeDialog_json);

        this.pages = 6;
        this.initPageView();
        this.initScrollView();

    },

    initPageView:function() {

        var self = this;
        this.count = 6;
        //this.m_pageview.removeAllPages();

        //设置pointbg的宽度
        var width = (4 + (this.count - 1) * 3) * 7;
        this.m_pointbg.setContentSize(cc.size(width,18));

        //for (var i = 0; i < self.count; ++i) {
        //    var layout = new ccui.Layout();
        //    layout.setContentSize(cc.size(560, 290));
        //    var layoutRect = layout.getContentSize();
        //
        //    var pageCell = new RechargePageShowCell(self.m_pageview, 1, self);
        //    pageCell.y = layoutRect.height;
        //    layout.addChild(pageCell);
        //    this.m_pageview.addPage(layout);
        //}
        this.m_green0.setVisible(true);
        this.m_pageview.addEventListener(this.onPageViewEvent, this);

    },
    pageViewEvent:function(sender, type) {
        var pageView = sender;
        switch (type) {
            case ccui.PageView.EVENT_TURNING:
                if(pageView.getCurPageIndex().valueOf() >= 0 && pageView.getCurPageIndex().valueOf() <= 5)
                {
                    this["m_green"+(pageView.getCurPageIndex().valueOf())].setVisible(true);
                    if(pageView.getCurPageIndex().valueOf() != 0) {
                        this["m_green"+(pageView.getCurPageIndex().valueOf() - 1)].setVisible(false);
                    }
                    if(pageView.getCurPageIndex().valueOf() != 5){
                        this["m_green"+(pageView.getCurPageIndex().valueOf() + 1)].setVisible(false);
                    }

                    this.m_pagetitle.setString(String(pageView.getCurPageIndex().valueOf()));
                }
                break;

            default :
                break;
        }
    },

    // pIdx: 该页显示内容索引
    // iIdx: 插入位置
    // bClone :是否克隆,第一页已存在为false, 否则为true
    addPage:function(pIdx, iIdx, bClone) {
        var newPage = null;
        if(!bClone) {
            newPage = new RechargePageShowCell(self.m_pageview, 1, self);
        }else{
            newPage = this.m_pageview.getPage(0).clone();
        }
        newPage.setTag(pIdx);
        this.m_pageview.insertPage(newPage, iIdx);
    },

    update:function() {
        //删除原来的页面(第一页用于clone)
        for(var i = this.m_pageview.getPages().count() - 1; ; ){
            this.m_pageview.removePageAtIndex(i);
        }

        // 添加新的页面
        pageIdx = 1;
        switch (this.pages){
            case 1:
                this.addPage(1, 0, false);
                break;
            case 2:
                this.addPage(2, 0, false);
                this.addPage(1, 1, true);
                this.addPage(2, 2, true);
                this.m_pageview.scrollToPage(1);
                break;
            default :
                this.addPage(pages, 0, false);
                this.addPage(1, 1, true);
                this.addPage(2, 2, true);
                this.m_pageview.scrollToPage(1);
                break;
        }

    },
    onPageViewEvent:function(sender, Type) {
        if(Type == ccui.PageView.EVENT_TURNING){
            if(this.pages >= 3) {
                if(0 == this.m_pageview.getCurPageIndex()){
                    this.pageIdx--;
                    if(this.pageIdx <= 0){
                        this.pageIdx = this.pages;
                    }
                    var nextPageIdx = this.pageIdx - 1;
                    if(nextPageIdx <= 0) {
                        nextPageIdx = this.pages;
                    }

                    this.m_pageview.removePageAtIndex(2);
                    this.addPage(nextPageIdx, 0 , true);
                    this.m_pageview.scrollToPage(1);
                }
                else if(2 == this.m_pageview.getCurPageIndex()) {
                    this.pageIdx++;
                    if(this.pageIdx > this.pages){
                        this.pageIdx = 1;
                    }
                    var nextPageIdx = this.pageIdx + 1;
                    if(nextPageIdx > this.pages){
                        nextPageIdx = 1;
                    }
                    this.m_pageview.removePageAtIndex(0);
                    this.addPage(nextPageIdx, 2, true);
                }
            }
            else if(2 == this.pages) {
                if(0 == this.m_pageview.getCurPageIndex()){
                    var nextPageIdx = 0;
                    if(1 == this.pageIdx){
                        this.pageIdx = 2;
                        nextPageIdx = 1;
                    }else{
                        this.pageIdx = 1;
                        nextPageIdx = 2;
                    }
                    this.m_pageview.removePageAtIndex(2);
                    this.addPage(nextPageIdx, 0, true);
                    this.m_pageview.scrollToPage(1);
                }
                else if(2 == this.m_pageview.getCurPageIndex()){
                    var nextPageIdx = 0;
                    if(1 == this.pageIdx){
                        this.pageIdx = 2;
                        nextPageIdx = 1;
                    }else{
                        this.pageIdx = 1;
                        nextPageIdx = 2;
                    }
                    this.m_pageview.removePageAtIndex(0);
                    this.addPage(nextPageIdx, 2, true);
                }
            }

        }
    },

    initScrollView:function() {
        this.fuckedScrollView = new FuckedScrollView(this.m_scrollview, this);
        var scrollSize = this.m_scrollview.getContentSize();

        cellCount = 7;
        this.cellList = [];
        var rowCount = Math.ceil(cellCount / 2);
        for(var index = 0; index < cellCount; ++index) {
            var row = Math.floor(index / 2);
            var col = index % 2;
            var cellNode = new RechargeListCell(this.fuckedScrollView, this);
            cellNode.setPosition(col * 310, -row * 210 -10);
            //
            cellNode.setData({key:1,add:45,count:1000,price:500});
            this.fuckedScrollView.addChild(cellNode);
            this.cellList.push(cellNode);
        }
        this.fuckedScrollView.setHeight(rowCount * 210);
    }
});
