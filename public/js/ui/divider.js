class Divider {
    constructor(leftElement, rightElement){
        let left = document.getElementById(leftElement);
        let right = document.getElementById(rightElement);;
        let div = newDiv(null, "divider");
      	let active = false;
      
        document.body.appendChild(div);
        div.style.left = left.offsetWidth + "px";
      
        this.handleMouseUp = function(){
            active = false;
        };
        
      	this.handleMouseMove = function(e){
          	if(active){
              	let x = e.clientX;
              	div.style.left = x + "px";
          		left.style.width = x + "px";
              	right.style.width = (window.innerWidth - x)  + "px";
              	right.style.left = x + "px";
            }
        };
      
      
        this.handleMouseDown = function(e){
            e.preventDefault();
            active = true;
            console.log("startDrag");
          	return false;
        };
      	
      	div.addEventListener("mousedown", this.handleMouseDown);
      	document.body.addEventListener("mouseup", this.handleMouseUp);
      	document.addEventListener("mousemove", this.handleMouseMove);
    };
};
