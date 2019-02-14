import {Request, Response} from "express";
import {exactMatchedFileIndex, openInIde} from "./utility";
import {ILineFinderData, lineToOpen} from "./line-finder";
import {getLocalConfig} from "./config";
import {sendData} from "./ws";
import {EIdeNames, EWSTypes} from "../enums";
import {IWSData} from "../interfaces";

const scan = require('./scan');
const root = process.cwd();
// const root = "D:\\nodebook\\master_bot_plateform\\bot_platform-fe";
const Server = require('ws').Server;

let folders: any[] = [], files: any = [];

export function routesInit(app: any) {

  function sendAck(ws: any, data: ILineFinderData) {
    sendData(ws, {type: EWSTypes.ack});
  }

  const server = new Server({port: 11640});
  server.on('connection', (ws: any) => {
    ws.on('message', (message: string) => {
      console.log(message);
      let data: IWSData = JSON.parse(message);

      if (data.type === EWSTypes.open) {
        handleOpenRequest(ws, <ILineFinderData>data.payload);
      } else if (data.type === EWSTypes.SEARCH) {
        handleSearchRequest(ws, <ILineFinderData>data.payload);
      } else if (data.type === EWSTypes.openByPath) {
        handleOpenByPathRequest(ws, <ILineFinderData>data.payload);
      } else if (data.type === EWSTypes.reIndex) {
        handleReIndexRequest(ws);
      }
    });
  });


  let localConfig = getLocalConfig();
  let ide_user_input = localConfig && localConfig.preferredIde;
  let tree = scan(root, "");

  app.get('/scan', function (req: Request, res: Response) {
    res.send(tree);
  });

  function rightClickHandler(data:{}) {

  }

  function searchData(data: any, searchTerms: string) {
    /*TODO: make it a pure function*/
    for (let d of data) {
      if (d.type === 'folder') {
        searchData(d.items, searchTerms);
        if (d.name.toLowerCase().match(searchTerms)) {
          folders.push(d);
        }
      } else if (d.type === 'file') {
        if (d.name.toLowerCase().match(searchTerms)) {
          files.push(d);
        }
      }
    }
    return {folders: folders, files: files};
  }

  async function handleOpenRequest(ws: any, payload: ILineFinderData) {
    files = [];
    folders = [];
    let pathToBeOpened, codeText;
    pathToBeOpened = payload.path;
    codeText = payload.codeText;
    let ide_clicked = payload.editor;
    if (!pathToBeOpened) {
      let searchTerm = payload.tagName && payload.tagName.toLowerCase().replace('app-', '');
      let foundItems = searchData(tree.items, searchTerm);
      if (!(foundItems && foundItems.files && foundItems.files.length > 0)) {
        sendData(ws, {error: 401, errorMessage: "ng-bubble: no matching file found", type: EWSTypes.open});
        return;
      }
      let exactMatchIndex = exactMatchedFileIndex(foundItems, searchTerm);
      pathToBeOpened = exactMatchIndex !== -1 ? foundItems.files[exactMatchIndex].path : foundItems.files[0].path;
    }

    try {

      let lineToOpenInIde:number = (await lineToOpen(pathToBeOpened, payload))||0;
      let currentIde = ide_clicked ? ide_clicked : ide_user_input;
      await openInIde(pathToBeOpened, currentIde, codeText, payload, lineToOpenInIde);
      sendData(ws, {error: 200, type: EWSTypes.ack});
    } catch (e) {
      console.error(e);
      sendData(ws, {error: 422, type: EWSTypes.ack});
    }
  }

  async function handleOpenByPathRequest(ws: any, payload: ILineFinderData) {
    await openInIde(payload.pathToOpen, payload.editor || ide_user_input, "");
    sendData(ws, {type: EWSTypes.openByPath, error: 200});
  }

  async function handleReIndexRequest(ws:any) {
    // await openInIde(payload.pathToOpen, payload.editor || ide_user_input, "");
    tree = scan(root, "");
    sendData(ws, {type: EWSTypes.ack, error: 200});
  }

  function handleSearchRequest(ws: any, payload: ILineFinderData) {
    files = [];
    folders = [];
    let file = (payload.file as string).toLowerCase();
    let pathToBeOpened;
    try {
      let foundItems = searchData(tree.items, file);
      /*todo: just to avoid ts error*/
      sendData(ws, {
        error: 200,
        type: EWSTypes.SEARCH,
        payload: {
          files: foundItems.files,
          file: "",
          tagName: "",
          targetTagName:"",
          innerText: "",
          id: "",
          classList: [],
          codeText: "",
          editor: EIdeNames.WEBSTORM,
          exact: false,
          path: "",
          pathToOpen: "",

        }
      });
    } catch (e) {
      console.error(e);
      sendData(ws, {error: 422, type: EWSTypes.SEARCH});
    }
  }

  // app.get('/open', async (req: Request, res: Response) => {//path
  //   files = [];
  //   folders = [];
  //   let pathToBeOpened, codeText: string, data: any = {classList: [], id: "", tagName: "", innerText: ""};
  //   let url_parts = url.parse(req.url, true);
  //   let query = url_parts.query;
  //   pathToBeOpened = query.path;
  //   try {
  //     data = query.data && JSON.parse(<string>query.data);
  //   } catch (e) {
  //     res.status(401).send("can't parse data");
  //     console.log("can't parse");
  //   }
  //   codeText = query.codeText as string;
  //   let ide_clicked = query.editor;
  //   if (!pathToBeOpened) {
  //     /*if there is no path, get filename and create path*/
  //     let file = (query.file as string).toLowerCase();
  //     let isExactSearch = query.exact === "true";
  //     let searchTerm = isExactSearch ? file : file.replace('app-', '');
  //     let foundItems = searchData(tree.items, searchTerm);
  //     if (!(foundItems && foundItems.files && foundItems.files.length > 0)) {
  //       res.status(200).json({messgage: "ng-bubble: no matching file found", index: tree.items});
  //       return;
  //     }
  //     let exactMatchIndex = exactMatchedFileIndex(foundItems, searchTerm);
  //     pathToBeOpened = exactMatchIndex !== -1 ? foundItems.files[exactMatchIndex].path : foundItems.files[0].path;
  //   }
  //
  //   try {
  //     let currentIde = ide_clicked ? ide_clicked : ide_user_input;
  //     await openInIde(pathToBeOpened, currentIde, codeText, data);
  //     // res.status(200).json("ng-bubble: success");
  //
  //   } catch (e) {
  //     console.error(e);
  //     res.status(422).send(e);
  //   }
  // });


  // app.get('/search', function (req: Request, res: Response) {//path
  //   files = [];
  //   folders = [];
  //   let url_parts = url.parse(req.url, true);
  //   let file = (url_parts.query.file as string).toLowerCase();
  //   let pathToBeOpened;
  //   try {
  //     let foundItems = searchData(tree.items, file);
  //     res.status(200).json(foundItems);
  //   } catch (e) {
  //     console.error(e);
  //     res.status(422).send(e);
  //   }
  // });
}