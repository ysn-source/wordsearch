const MAXSIZE = 4;
const expected = ["RAFT", "TAR", "FAR", "ARC", "RAG", "RAGS", "STY","TART","BAY"];
const possible = [-1,0,1];
const grid = [["F","T","R","D"],["A","R","C","M"],["G","T","Y","A"],["P","S","Q","B"]];

var HISTO = new Array();
var RESULT = new Array();
var O=0;

const crossjoin = (a,b) => a.flatMap(x => b.map(y=> ({"x":x,"y":y})));
const  computePossibilities = (pgrid = grid) => {
    let p = crossjoin(possible,possible);    
    return pgrid.flat().map((v,i,s) => p.map(n => ({"x":  (i%MAXSIZE+n.x)%MAXSIZE, "y":  (Math.floor(i/MAXSIZE)+n.y)%MAXSIZE }))
    .filter(f => ((f.x>=0 && f.y>=0) || (v.x==f.x && v.y==f.y)))
    );
}

var nextPossibilities= computePossibilities();
//console.log(allPossibilities);

const flatSearch = async function (last = Array.of({"x":0,"y":0}),histo = HISTO,smart=false) {
    let p =  new Promise((res,rej) => {
        sendLoopCount(histo);
        let lastflat = ((last[last.length-1].y) ? (last[last.length-1].y)*MAXSIZE : 0) + last[last.length-1].x ;
        nextPossibilities[lastflat].forEach(k => { //only real positions  // each x and y
           
            if (!last.some(co => co.x==k.x&&co.y==k.y)) { //same coordinates
                O++;
                let current = [...last,{"x":k.x,"y":k.y}];
                if ((current.length == MAXSIZE-1 || MAXSIZE) && hasMatch(current)) 
                    RESULT.push({"c":current,"r":toChars(current),"t":performance.now(),"o":O}); 
                if (last.length>=MAXSIZE) {
                    if (!smart) flatSearch(Array.of({"x":k.x,"y":k.y}),histo,smart); //reset to 1 char
                }
                else if (!histo.some(v => v==toChars(current))) { //already in history
                    histo.push(toChars(current));  // historize current values
                    flatSearch(current,histo,smart); // advance to next letter (recursive)
                }
            }
                
        })
        res(O);
    })
    await p;
}



const smartLaunch = async function () {
   
    var p;
    
    expected.map(v=>v.substr(0,1)).filter(distinct).forEach(c => {
        p = new Promise((res,rej) => {
            let shisto = HISTO;   
            
            let mygrid = grid.flat().map((v,i,s)=> (v==c)  ? i : -1).filter((_) => _!=-1);
            mygrid.forEach(x=> {
                smartSearch(Array.of({"x": x%MAXSIZE,"y": Math.floor(x/MAXSIZE)}),HISTO,true);
            });
            res(O);
        });
        
        
    });
    await p;
    
}

self.onmessage = (ep) => { if (ep.data.cmd=="flat") launchFlat(); else if (ep.data.cmd=="launch") launch(); else if (ep.data.cmd=="smart") launchSmart(); }

const distinct = (value,index,self) => self.indexOf(value) === index;
const toChars = (strcoord) => strcoord.map((j) => grid[j.y][j.x]).join("").toString().toUpperCase();
const hasMatch = (strcoord) => (expected.some(t=> t==toChars(strcoord))); //check match (boolean returned)
const resetCounters = () => { RESULT = new Array(); HISTO= new Array(); O=0;}
const launchFlat = () => { resetCounters(); let t1 = performance.now(); flatSearch(); sendResult(t1); sendHistory(HISTO);};
const launch = () => { resetCounters(); let t1 = performance.now(); search(); sendResult(t1); sendHistory(HISTO);};
const launchSmart = () => {  resetCounters(); let t2 = performance.now(); smartLaunch(); sendResult(t2); sendHistory(HISTO);};

const sendLoopCount = (histo) =>  self.postMessage({"type":"loop","data":{"O":O,"detail":histo[histo.length-1]}});
const sendResult = (s) => self.postMessage(
    {"type":"result"
    ,"data":RESULT.map(t => "("+t.c.map(xy=> xy.x+","+xy.y).join("=>")+")"+t.r +" @ "+ Math.round(t.t-s) + "ms ("+t.o+" loops)").join("<br/>")});  
    //RESULT.forEach(t => console.log(t.r +" @ "+ Math.round(t.t-s)+ "ms ("+t.o+" loops)"));
const sendHistory= (histo) => (histo) ? self.postMessage({"type":"history","data":histo.reduce((a,t) => a+=t +"\n")}) : 0;



const search = async function (last = Array.of({"x":0,"y":0}),histo = HISTO,smart=false) {
    let p =  new Promise((res,rej) => {
        sendLoopCount(histo);
        let nextx =  possible.map(n => last[last.length-1].x+n).filter(t=> t<MAXSIZE&&t>=0); //only real positions x
        let nexty=  possible.map(n => last[last.length-1].y+n).filter(t=> t<MAXSIZE&&t>=0); //only real positions y
        nextx.forEach(ix => { // each x
            nexty.forEach(iy => { // each y
                
                if (!last.some(n => n.x==ix&&n.y==iy)) { //same coordinates
                    O++;
                    let current = [...last,{"x":ix,"y":iy}];
                    if ((current.length == MAXSIZE-1 || MAXSIZE) && hasMatch(current)) RESULT.push({"c":current,"r":toChars(current),"t":performance.now(),"o":O}); 
                    if (last.length>=MAXSIZE) { if (!smart) search(Array.of({"x":ix,"y":iy})); } //reset to 1 char
                    else if (!histo.some(v => v==toChars(current))) { //already in history
                        histo.push(toChars(current));  // historize current values
                        search(current,histo,smart); // advance to next letter (recursive)
                    }
                }
                
            })
        })
       res(O);
    })
    await p;
}

/*
n => ( {"x": (li.y) ? (li.x+n.x)%li.x + Math.floor((li.y+n.y)/li.y) : li.x+n.x,
                          "y": (li.x) ? (li.y+n.y)%li.y + Math.floor((li.x+n.x)/li.x) : li.y+n.y })
                          */

const smartSearch = async function (last = Array.of({"x":0,"y":0}),histo = HISTO,smart=false) {
let p =  new Promise((res,rej) => {
    sendLoopCount(histo);
    let lastflat = ((last[last.length-1].y) ? (last[last.length-1].y)*MAXSIZE : 0) + last[last.length-1].x ;
    nextPossibilities[lastflat]
    .forEach(k => { //only real positions  // each x and y
        if (expected.map(v=>v.substr(last.length,1)).filter(distinct).some(e => e==grid[k.y][k.x])
        &&!last.some(n => n.x==k.x&&n.y==k.y)) { //same coordinates
            O++;
            let current = [...last,{"x":k.x,"y":k.y}];
            if ((current.length == MAXSIZE-1 || MAXSIZE) && hasMatch(current)) 
                RESULT.push({"c":current,"r":toChars(current),"t":performance.now(),"o":O}); 
            if (last.length>=MAXSIZE) {
                if (!smart) smartSearch(Array.of({"x":k.x,"y":k.y}),histo,smart); //reset to 1 char
            }
            else if (!histo.some(v => v==toChars(current))) { //already in history
                histo.push(toChars(current));  // historize current values
                smartSearch(current,histo,smart); // advance to next letter (recursive)
            }
        }
            
    })
    res(O);
})
await p;
}