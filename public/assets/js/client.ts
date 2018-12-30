let $body = document.getElementsByTagName('body')[0];

$body.innerHTML += `
<img id="init-img" style="width: 40px; cursor: pointer;position: fixed; bottom: 5%; left: 5%; z-index: 1000000000000;"
     src="https://cdn2.iconfinder.com/data/icons/circle-icons-1/64/magnifyingglass-512.png" alt="">


<div id="ng-bubble-container" style="background-color: rgba(233,84,32,0.29)">
    <main class="ng-bubble-autocomplete">
        <div style="position: relative;">
            <input id="ng-bubble-search" type="text"
                   autofocus
                   style="height: 44px; width: 100%;
                   border-top-left-radius: 8px;
                   border-top-right-radius: 8px;
                   outline: none;
           border: 1px solid #e95420;
           font-size: 30px;
           color: white;
            padding-left: 10px; background-color: rgba(233,84,32,0.64)!important">
            <img style="position: absolute; right: 3%; height: 70%; transform: translateY(50%); bottom: 50%;"
                 src="https://cdn2.iconfinder.com/data/icons/circle-icons-1/64/magnifyingglass-512.png" alt="">
            <div id="row-wrapper" style="position: absolute; top: 100%; left: 0; right: 0">
                <div style="padding: 7px; border: 1px solid #e95420;">
                    <strong style="font-size: 13px; color:  #e95420">Search files and folders</strong>
                </div>
            </div>
        </div>

    </main>

</div>

`


let startWithAppRegex = new RegExp('^app-', 'i');
const BACKEND_ROOT = 'http://localhost:11637';
const BG_HIGHLIGHTED_CLASS = 'bg-highlighted';
document.addEventListener('dblclick', ($event) => {

    let element = $event.target as HTMLElement;
    while (!startWithAppRegex.test(element.tagName)) {
        element = element.parentElement as HTMLElement;
    }
    sendNgTag(element.tagName, false);
});


function makeGetReq(url:string) {
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", `${BACKEND_ROOT}/${url}`, true);
    xhttp.send();
    return new Promise((resolve, reject) => {
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                console.log("success");
                console.log(xhttp.responseText);
                try {
                    resolve(JSON.parse(xhttp.responseText));
                } catch (e) {
                    reject("something went wrong");
                }
            }
        };
    })
}

function sendNgTag(tag:string, exact:boolean) {
    let url = `open?file=${tag}&exact=${exact}`;
    makeGetReq(url)
        .then(() => {
            console.log("success");
        })
}

function sendFilePath(path:string, editor: string) {
    let url = `open?path=${path}&editor=${editor}`;
    makeGetReq(url)
        .then(() => {
            console.log("success");
        })
}

function getFileNames(searchTerm:string) {
    new Promise((resolve, reject) => {

    })
}


let $search = document.getElementById('ng-bubble-search') as HTMLInputElement;
let $rowWrapper = document.getElementById('row-wrapper') as HTMLDivElement;
let resultRows = document.getElementsByClassName('row-wrapper-item');
$search.addEventListener("input", function ($event) {
    let searchTerm = $search.value;
    let url = `search?file=${searchTerm}`;
    makeGetReq(url)
        .then((val:any) => {
            let files = val.files;
            let newRowsStr = "";
            files.forEach((file:any) => {
                newRowsStr +=
                    `<div class="row-wrapper-item" style="display: flex; align-content: center" title=${file.path} data-path=${file.path}>
                        <span>${file.name}</span>
                        <img class="editor-logo" data-editor="webstorm" title="Open in Webstorm" style="width: 15px; height: 15px; margin-right: 5px; margin-left: auto" src="http://resources.jetbrains.com/storage/products/webstorm/img/meta/webstorm_logo_300x300.png" alt="">
                        <img class="editor-logo" data-editor="vscode" title="Open in VScode" style="width: 15px; height: 15px; margin-right: 10px" src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Visual_Studio_Code_1.18_icon.svg" alt="">
                     </div>`;
            });
            $rowWrapper.innerHTML = newRowsStr;
        });
});

// var elem = document.getElementById('ng-bubble-search');
// elem.addEventListener('keydown', function(e){
//     alert();
//     if (e.keyCode == 13) {
//         console.log('You pressed a "enter" key in somewhere');
//     }
// });

let highligtedRowCount = -1;


function hasClass(element:HTMLElement, thatClass:string) {
    // var className = " " + className + " ";
    return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(" " + thatClass + " ") > -1
}

function toggleHighlightRow(index: number, doHighlight:boolean) {
    try {
        let resultRows = document.getElementsByClassName('row-wrapper-item');
        let ele = resultRows[index];
        if (doHighlight === false) {
            ele.classList.remove(BG_HIGHLIGHTED_CLASS);
        } else {
            resultRows[index].classList.add(BG_HIGHLIGHTED_CLASS);
        }
    } catch (e) {
        console.log(e);
    }
}

$search.addEventListener("keydown", function ($event: KeyboardEvent) {
    console.log($event.keyCode);
    console.log("keydown pressed");
    let resultRows = document.getElementsByClassName('row-wrapper-item');
    toggleHighlightRow(highligtedRowCount, false);
    if ($event.keyCode === 38) {//up arrow
        if (highligtedRowCount <= 0) {
            highligtedRowCount = resultRows.length - 1;
        } else {
            highligtedRowCount--;
        }
    } else if ($event.keyCode === 40) {// down arrow
        if (highligtedRowCount >= resultRows.length - 1) {
            highligtedRowCount = 0;
        } else {
            highligtedRowCount++;
        }
    }

    if ($event.keyCode === 13) {// enter key
        let searchTerm = (resultRows[highligtedRowCount] as HTMLDivElement).innerText;
        sendNgTag(searchTerm, true);
    }
    toggleHighlightRow(highligtedRowCount, true);
});

$rowWrapper.addEventListener("click", function ($event: Event) {
    debugger;
    $event.stopPropagation();
    let $target = $event.target as HTMLElement;
    let $row: HTMLElement;
    let editor:any = "";
    if (hasClass($target, 'row-wrapper-item')) {
        $row = $target;
    }else {
        $row = $target.parentElement as HTMLElement;
        /*check if editor logos are clicked*/
        if (hasClass($target, 'editor-logo')) {
            editor = $target.getAttribute('data-editor');
        }
    }
    let path:any = $row.getAttribute('data-path');
    sendFilePath(path, editor);
});

let $initImg = document.getElementById('init-img') as HTMLImageElement;
let $ngBubbleContainer = document.getElementById('ng-bubble-container') as HTMLDivElement;

$ngBubbleContainer.addEventListener('click', ($event) => {
    $event.stopPropagation();
    if ($event.target === $ngBubbleContainer) {
        hideSearchBar();
    }

});

$initImg.addEventListener('click', () => {
    hideSearchBar();
});

function hideSearchBar() {
    if (hasClass($ngBubbleContainer, 'display-none')) {
        $ngBubbleContainer.classList.remove('display-none');
    } else {
        $ngBubbleContainer.classList.add('display-none');
    }
}

