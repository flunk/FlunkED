class UploadManager {
  	constructor(){
        let dropZone = document.getElementById("fileBrowser");

      	dropZone.addEventListener('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
      
      	dropZone.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();
          	var file;
            let files = e.dataTransfer.files; // Array of all files
            for (var i=0, file; file=files[i]; i++) {
                let jemoeder = file;
                let reader = new FileReader();
                reader.onload = function(e2) { // finished reading file data.
                  upload(jemoeder, e2.currentTarget.result);
                  updateFiles();

                }
                reader.readAsBinaryString(file); // start reading the file data.  
        	}   
        });
      
      	function upload(file, data){
            console.log(file);
            log("UPLOAD:" + pwd() + file.name);
            var request = uploadRequest("api/save/"+file.name+"?cd="+pwd(), data);
            if(request.status == 200){
              	log("UPLOAD: "+pwd() + file.name + " OK!");
            } else {
              	log("UPLOAD: "+pwd() + file.name + " ERROR: " +  request.responseText);
              	handleError(request);
            }

        }
      
      	function uploadRequest(yourUrl, data){
            var Httpreq = new XMLHttpRequest(); // a new request
            Httpreq.open("POST",yourUrl,false);
            Httpreq.setRequestHeader("X-Csrf-Token", csrfToken);
            Httpreq.setRequestHeader("Content-Type", "application/octet-stream");
            Httpreq.send({data:data});
            return Httpreq;
        }
	}
};
