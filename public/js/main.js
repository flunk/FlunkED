var projectDir = [];
var currentDir = [];
var currentFile = null;
var currentTabs = [];
var currentTab = null;
var csrfToken = null;
var tabCounter = 0;

var uploadManager = new UploadManager();
var divider = new Divider("fileBrowserMain", "editorMain");
	
var pageLoaded = function(){
  	reAuth();
  	myCodeMirror = addCodeMirrror("tab1", "");

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      	var target = $(e.target).attr("href") // activated tab
      	changeTab(target);
    });
  	
  	$("#loginUser").keyup(function (e) {
        if (e.keyCode == 13) {
            login();
        }
    });
  	
  	$("#loginPass").keyup(function (e) {
        if (e.keyCode == 13) {
            login();
        }
    });
  
    document.addEventListener("keydown", function(e) {
      if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
          e.preventDefault();
          saveFile();
      }

      var nodeName = e.target.nodeName.toLowerCase();

      if (e.which === 8) {
            if ((nodeName === 'input') ||
                nodeName === 'textarea') {
                // do nothing
            } else {
                e.preventDefault();
            }
      	}
  	}, false);
  	window.addEventListener('resize', resize);
  	
}

function resize(e){
  	var i = 0;
  	while(i < currentTabs.length){
     	currentTabs[i].codeMirror.getWrapperElement().style.height = window.innerHeight - 111 + "px";
      	i++; 
    }
  	var fileBrowser = document.getElementById("fileBrowserMain");
  	fileBrowser.style.height = window.innerHeight - 71 + "px";
}

function showContextMenu(e, file){
	var list = document.createElement("ul");
  	list.id = "contextMenu";
  	list.className = "dropdown-menu";  
  	list.style.display = 'block';
  	list.style.left = e.clientX - 10 + "px";
  	list.style.top = e.clientY -10 + "px";
  
	newMenuItem("New File", list, function(){
    	list.parentNode.removeChild(list);
      	newFile();
    });
  
  	newMenuItem("New Directory", list, function(){
    	list.parentNode.removeChild(list);
      	newDirectory();
    });
  
	if(file.name != ".."){
        newMenuItem("Delete", list, function(){
            list.parentNode.removeChild(list);
          	deleteFile(file);
        });
        newMenuItem("Rename", list, function(){
            list.parentNode.removeChild(list);
        });
      	
        //newMenuItem("Copy", list, function(){
        //    list.parentNode.removeChild(list);
        //});
    }

  	//newMenuItem("Paste", list, function(){
    //	list.parentNode.removeChild(list);
    //});
  
  	list.onmouseleave=function(){
    	list.parentNode.removeChild(list);
    };
  
 	document.body.appendChild(list);
}

function newMenuItem(title, parent, onClick){
 	var item = document.createElement("li");
  	var link = document.createElement("a");
  	link.innerText = title;
  	link.onclick = onClick;
  	item.appendChild(link);
  	parent.appendChild(item);
}

function newFile(){
  	var okButton = newButton("Ok");
    okButton.onclick = newFileSubmit;
  
  	var inputGroup = newDiv(null, "input-group");
  
	var inputField = newElement("input", "newFileName", "form-control");
  	inputField.setAttributeNode(newAttribute("type", "text"));
    inputField.setAttributeNode(newAttribute("placeholder", "Filename"));
  
   	$(inputField).keyup(function (e) {
        if (e.keyCode == 13) {
            newFileSubmit();
        }
    });
  
	inputGroup.appendChild(inputField);
  
 	newModal("New File", true, inputGroup, okButton);
  	inputField.focus();
}



function newFileSubmit(){
  	var fileName = document.getElementById("newFileName").value;
  	if(fileName != ""){
      	log("CREATE: " + pwd() + fileName);
     	var request = post("api/newFile/"+fileName+"?cd="+pwd(), "");
      	if(request.status == 200){
        	log("CREATE: " + pwd() + fileName + " OK!");
          	updateFiles();
          	$('#newModal').modal('hide');
      	} else {
        	log("CREATE: " + pwd() + fileName + " ERROR: " +  request.responseText);
        	handleError(request);
      	}
    }      	
}

function newDirectory(){
  	var okButton = newButton("Ok");
    okButton.onclick = newDirSubmit;
  
  	var inputGroup = newDiv(null, "input-group");
  
	var inputField = newElement("input", "newDirName", "form-control");
  	inputField.setAttributeNode(newAttribute("type", "text"));
    inputField.setAttributeNode(newAttribute("placeholder", "Filename"));
  
   	$(inputField).keyup(function (e) {
        if (e.keyCode == 13) {
            newDirSubmit();
        }
    });
  
	inputGroup.appendChild(inputField);
  	
 	newModal("New Directory", true, inputGroup, okButton);
  	document.getElementById("newDirName").focus();
}

function newDirSubmit(){
  	var fileName = document.getElementById("newDirName").value;
  	if(fileName != ""){
      	log("CREATE: " + pwd() + fileName);
     	var request = post("api/newDir?cd="+pwd()+fileName, "");
      	if(request.status == 200){
        	log("CREATE: " + pwd() + fileName + " OK!");
          	updateFiles();
          	$('#newModal').modal('hide');
      	} else {
        	log("CREATE: " + pwd() + fileName + " ERROR: " +  request.responseText);
        	handleError(request);
      	}
    }      	
}

function deleteFile(file){
  	var fullPath = "" + pwd() + file.name;
  	var okButton = newButton("Ok");
    okButton.addEventListener("click", function() {
    	deleteFileSubmit(fullPath);
	}, false);
  
  	var textDiv = newDiv(null, null);
  	textDiv.innerText = "You are about to delete: " + fullPath + ". THERE IS NO UNDO!! ARE YOU SURE?!";
  
 	newModal("Delete", true, textDiv, okButton);
}

function deleteFileSubmit(fullPath){
  	log("DELETE: " + fullPath);
  	var request = post("api/delete?cd=" + fullPath, "");
  	$('#newModal').modal('hide');
    if(request.status == 200){
    	log("DELETE: " + fullPath + " OK!");
        updateFiles();
        
    } else {
      	log("DELETE: " + fullPath + " ERROR: " +  request.responseText);
    	handleError(request);
  	}
}

function newModal(title, closeButton, contentNode, buttonNode){
	var modal = newDiv("newModal", "modal fade");
  	var dialog = newDiv(null, "modal-dialog");
  	var content = newDiv(null, "modal-content");
  	var header = newDiv(null, "modal-header");
  	var body = newDiv(null, "modal-body");
  	var footer = newDiv(null, "modal-footer");
  
  	var headerTitle = document.createElement("h4");
  	headerTitle.innerText = title;
  
    if(closeButton){
      	var attribute = newAttribute("data-dismiss", "modal");
      	var dismissButton = newButton("&times;", "close", attribute);
  		header.appendChild(dismissButton);	
    }
      
    if(contentNode != null){
    	 body.appendChild(contentNode);
    }
      
    if(buttonNode != null){
      	 footer.appendChild(buttonNode);
    }
    
  	modal.appendChild(dialog);
  	dialog.appendChild(content);
  	content.appendChild(header);
  	header.appendChild(headerTitle);
  	content.appendChild(body);
  	content.appendChild(footer);
  	document.body.appendChild(modal);
  	$('#newModal').modal('show');
  
    $('#newModal').on('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    })
  	return modal;
}

function newAttribute(name, value){
	var attr = document.createAttribute(name);
    attr.value = value;
  	return attr;
}

function newButton(caption, buttonClass, attribute){
  	var button = document.createElement("button");
  	if(buttonClass != null){
      	button.className = buttonClass;
    } else {
      	button.className = "btn btn-primary";
    }
  	if(caption == "&times;"){//innerHTML is a security risk, this is the only exception
      	button.innerHTML = caption;
    } else {
      	button.innerText = caption;
    }
  
  	if(attribute != null){
      	button.setAttributeNode(attribute);
    }
  	
  	return button;
}

function initLogin(){
  	$('#loginModal').modal({backdrop: 'static', keyboard: false})  
  	$('#loginModal').modal('show');
  	
  	document.getElementById("loginUser").focus();
}

function addCodeMirrror(tab, content){
	var cm = CodeMirror(document.getElementById(tab), {
		value: content,
		mode:  "javascript",
		theme: "flunked",
		lineNumbers:true,
	});
	
	cm.getWrapperElement().style.height = window.innerHeight - 111 + "px";
	cm.refresh();
	return cm;
}

var login = function(){
	 var output = document.getElementById("loginOutput");
  	 output.innerHTML = '';
  	 output.innerHTML = '<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate">';
  	 var username = document.getElementById("loginUser").value;
  	 var pass = document.getElementById("loginPass").value;
  
     var request = post("api/login", {user:username, pass:pass});
     if(request.status == 200){
       	var loginResponse = request.responseText;
       	var resData = JSON.parse(loginResponse);
        csrfToken = resData.csrfToken;
        output.innerHTML = '';
        $('#loginModal').modal('hide');
        initEditor();
     } else {
       	output.innerHTML = '<div class="label label-danger" role="alert">Login/Pass incorrect</div>';
     }
}

function reAuth(){
 	console.log("Attempting to reauthenticate...");
  	var request = post("api/reauth", null);
    if(request.status == 200){
        var resData = JSON.parse(request.responseText);
        csrfToken = resData.csrfToken;
        initEditor();
    } else {
        initLogin();
    }
}

function initEditor(){
 	updateFiles(); 
}

var saveFile = function(){
	var value = currentTab.codeMirror.getValue();
	if(currentTab != null){
		log("SAVE:"+currentTab.dir+currentTab.name);
      	var request = post("api/save/"+currentTab.name+"?cd="+currentTab.dir, value);
      	if(request.status == 200){
        	 log("SAVE: "+currentTab.dir+currentTab.name + " OK!");
        } else {
         	log("SAVE: "+currentTab.dir+currentTab.name + " ERROR: " +  request.responseText);
          	handleError(request);
        }
    }
}

function handleError(request){
	if(request.status == 401){
    	initLogin();
    }
}

var addFile = function(file){
	var fileBrowserItem = document.createElement("a");
	fileBrowserItem.className = 'list-group-item';
	fileBrowserItem.addEventListener('contextmenu', function(ev) {
    	ev.preventDefault();
		showContextMenu(ev, file);
    	return false;
	}, false);

	if(!file.isDir){
		fileBrowserItem.addEventListener('dblclick', function(){
			loadFile(file.name);
		});
      	fileBrowserItem.innerText = file.name;
	} else {
    	fileBrowserItem.addEventListener('dblclick', function(){
			cd(file.name);
		});
        fileBrowserItem.innerText = "/" + file.name;
    }
	
	document.getElementById("fileBrowserMain").appendChild(fileBrowserItem);
}

var loadFile = function(name){
	var curDir = pwd();
   	var request = Get("api/file/"+name+"?cd="+curDir);
  
  	var existingTab = null;
  	var i = 0;
  	while(i < currentTabs.length){
     	if(currentTabs[i].name  == name && currentTabs[i].dir == curDir){
         	existingTab = currentTabs[i];
          	i = currentTabs.length;
        }
		i++; 
    }
  
  	if(existingTab){
      	$(existingTab.a).tab("show");
    } else {
        if(request.status == 200){
            var file = request.responseText;
            myCodeMirror.setValue(file);
            currentFile = name;
            log("OPEN: "+curDir+name);
            addTab(name,curDir,file);
        } else {
            log("OPEN ERROR: "+curDir+name+request.responseText);
            handleError(request);
        }
    }
};

function Get(yourUrl){
	var Httpreq = new XMLHttpRequest(); // a new request
	Httpreq.open("GET",yourUrl,false);
  	Httpreq.setRequestHeader("X-Csrf-Token", csrfToken);
	Httpreq.send(null);
	return Httpreq;
}

function post(yourUrl, data){
	//console.log(data);
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("POST",yourUrl,false);
  	Httpreq.setRequestHeader("X-Csrf-Token", csrfToken);
    Httpreq.setRequestHeader("Content-Type", "application/json");
    Httpreq.send(JSON.stringify({data:data}));
    return Httpreq;
}

function updateFiles(){
  	var request = Get("api/dir?cd=" + pwd());
  	if(request.status == 200){
        projectDir = JSON.parse(request.responseText);
        var fileBrowser = document.getElementById("fileBrowserMain");
        fileBrowser.innerHTML = "";
        fileBrowser.style.height = window.innerHeight - 71 + "px";
        addFile({isDir:true, name:".."});

        var i = 0;
        while ( i < projectDir.length){
            if(projectDir[i].isDir){
                addFile(projectDir[i]);
            }
            i++;
        }

        i = 0;
        while ( i < projectDir.length){
            if(!projectDir[i].isDir){
                addFile(projectDir[i]);
            }
            i++;
        }
      	log("CD:"+pwd());
    } else {
      	log("CD ERROR: " + request.responseText);
      	handleError(request);
    }
}

function cd(dir){
    if(dir == ".."){
    	currentDir.pop();
    } else {
      	currentDir.push(dir);
    }
    updateFiles();
}

function pwd(){
 	var result = "/";
    var i = 0;
  	while ( i < currentDir.length){
    	result += currentDir[i] + "/";
      	i++;
    }
  	return result;
}

function log(toLog){
 	document.getElementById("statusBar1").innerText = toLog; 
}

function addTab(name,dir, content){
  	var tabName = "tb" + tabCounter++;
	var pane = newDiv(tabName, "tab-pane");
  	
  	document.getElementById("editorPanes").appendChild(pane);
  
  	var tabs = document.getElementById("editorTabs");
  	var li = document.createElement("li");
  	tabs.appendChild(li);
    var a = document.createElement("a");
  	a.href = "#" + tabName;
  	$(a).attr("data-toggle","tab");
    a.innerText = name + " ";
  	
  
  	var close = document.createElement("a");
	close.innerHTML = "&times;";
  	close.href = "#";

  
  	a.appendChild(close);
  	li.appendChild(a);
  
   	$(a).on('shown.bs.tab', function (e) {
      	var target = $(e.target).attr("href") // activated tab
      	changeTab(target);
    });
  	$(a).tab("show");

  
  	var cm = addCodeMirrror(tabName, content);
  	var tab = {name:name, dir:dir, tab:li, pane:pane, codeMirror:cm, a:a};
  	currentTab = tab; 
  	currentTabs.push(currentTab);
  
  
  	close.onclick = function(e){
      	e.preventDefault();
      	//console.log(currentTab);
      	li.parentNode.removeChild(li);
      	pane.parentNode.removeChild(pane);
      	
      	var index = currentTabs.indexOf(tab);
      	if (index > -1) {
    		currentTabs.splice(index, 1);
		}
      
      	if(currentTabs.length > 0){
        	$(currentTabs[currentTabs.length -1].a).tab("show");
        }
    };
}

function newDiv(id, className){
  	return newElement("div", id, className);
};

function newElement(type, id, className){
	var result = document.createElement(type);
  
  	if(id){
      	result.id = id;
    }
  	if(className){
      	result.className = className;
    }
	
  	return result;
}


function changeTab(tab){
	var tabIndex = tab.split("#tb");
  	
  	if(tabIndex.length > 1){
     	currentTab = currentTabs[tabIndex[1]];
		console.log(currentTab);
    }
}
