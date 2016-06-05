class FileBrowser extends Div {
    constructor(){
		super(null, "fileBrowser");
      	this.main = new Div("fileBrowserMain",  "list-group table-of-contents");
      	this.addChild(this.main);
      
      	this.addItem("jemoeder", function(){alert(1)});
      	this.addItem("jemoeder2", function(){alert(2)});
      
      	this.show();
    }
  	
  	addItem(caption, onclick){
      	let link = new Link("jemoeder", "list-group-item", "");
      	link.text = caption;
      	link.element.onclick = onclick;
      	this.main.addChild(link);
    }
};