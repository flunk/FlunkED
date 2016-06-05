class Editor extends Div {
    constructor(brand){
		super("editorMain");
      	this.tabs = new Div("editorTabs", "nav nav-tabs");
      	this.addChild(this.tabs);
      	
      	this.content = new Div("editorPanes", "tab-content");
      	this.addChild(this.content);
      	
      	this.show();
    }
};