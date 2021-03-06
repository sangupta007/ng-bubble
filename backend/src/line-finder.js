"use strict";
/*read the file line by line =>
* remove all extra spaces
* 1. look start tag names (MUST have, because tag names aren't dynamically generated) 1xx
* 2. look for ids (optional) x1x
* 3. look for presence of class names xx1
* */
Object.defineProperty(exports, "__esModule", { value: true });
let i = 1; //starts with 1, not 0
let maxScore = 0;
let maxScoreLine = 0;
function lineToOpen(file, data) {
    let lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(file)
    });
    i = 1;
    maxScoreLine = 1;
    maxScore = 0;
    let maxPossibleScore = getMaxPossibleScore(data);
    data = Object.assign({}, data, { targetTagName: data.targetTagName && data.targetTagName.toLowerCase().trim(), innerText: data.innerText && removeAdditionalSpaces(data.innerText) });
    return new Promise((resolve, reject) => {
        lineReader.on('line', function (line) {
            if (!line) {
                ++i;
                return;
            }
            line = line.trim();
            let score = getScore(line, data);
            if (score > maxScore) {
                maxScore = score;
                maxScoreLine = i;
            }
            if (maxScore >= maxPossibleScore) {
                resolve(maxScoreLine);
                /*todo: stop reading the line here*/
                return;
            }
            ++i;
        });
        lineReader.on('close', function (line) {
            resolve(maxScoreLine);
        });
    });
}
exports.lineToOpen = lineToOpen;
function getMaxPossibleScore(data) {
    if (!data || !data.classList) {
        return 0;
    }
    return Number("1" + (data.id ? 1 : 0) + data.classList.length + (data.innerText ? 1 : 0));
}
function getScore(htmlLine, lineFinderData) {
    let scoreStr = (tagScore(htmlLine, lineFinderData.targetTagName)
        + getInnerTextScore(htmlLine, lineFinderData.innerText)
        + idScore(htmlLine, lineFinderData.id))
        + ""
        + classScore(htmlLine, lineFinderData.classList);
    // 
    // 
    // 
    // 
    return Number(scoreStr);
}
function getInnerTextScore(htmlLine, innerText) {
    if (!htmlLine || !innerText) {
        return 0;
    }
    return htmlLine.includes(innerText) ? 1 : 0;
}
function removeAdditionalSpaces(str) {
    return str && str.replace(/\s+/g, ' ').trim();
}
function tagScore(htmlStr, tag) {
    if (!htmlStr || !tag) {
        return 0;
    }
    tag = tag.toLowerCase().trim();
    return htmlStr.includes(`<${tag}`) ? 1 : 0;
}
function idScore(htmlStr, id) {
    if (!htmlStr || !id) {
        return 0;
    }
    id = id.toLowerCase().trim();
    return (htmlStr.includes(`id='${id}'`) || htmlStr.includes(`id="${id}"`)) ? 1 : 0;
}
function classScore(htmlStr, classList) {
    if (!htmlStr || !classList) {
        return 0;
    }
    let score = 0;
    let regex = /class="(.*?)"/g;
    let realClassArr;
    try {
        let matchedGroup = regex.exec(htmlStr)[1];
        if (!matchedGroup)
            return score;
        realClassArr = matchedGroup.split(" ");
    }
    catch (e) {
        
        return score;
    }
    classList.forEach((expectedClassName) => {
        let classFound = realClassArr.find((realClass) => realClass === expectedClassName);
        if (classFound)
            ++score;
    });
    return score;
}
//# sourceMappingURL=line-finder.js.map