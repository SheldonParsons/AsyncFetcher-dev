/*global chrome*/
import {
  openDB,
  addData,
  readData,
  cleanData,
  removeAllInterfaceList,
  listenAllInterface,
  set,
  removeData,
  reset_page,
  addDownloadPathData,
} from "./common";
import { apiRequests } from "@/api";
import { installed } from "./installed";
import {
  sendHttpRequest,
  getGlobalListenerSwitch,
  resetGlobalParams,
  sendInterface,
  exportFiles
} from "./message";

const Listener_All_Interface = true;

var db;

async function packGetGlobalListenerSwitch(db, sender) {
  const message = {
    greeting: "switch_listener",
    flag: await getGlobalListenerSwitch(db),
  };
  chrome.tabs.sendMessage(sender.tab.id, message);
}

function initDB() {
  openDB().then((res) => {
    db = res;

    if (Listener_All_Interface) listenAllInterface();
    chrome.runtime.onConnect.addListener((port) => {
      port.onMessage.addListener((request) => {
        const { greeting } = request;

        if (greeting === "apiRequest") {
          sendHttpRequest(request, port.sender.tab.id, port.postMessage);
        } else if (greeting === "clean_user_info") {
          resetGlobalParams(db);
        } else if (greeting === "get_global_listener") {
          packGetGlobalListenerSwitch(db, port.sender);
        } else if (greeting === "reset_page") {
          reset_page(port.sender.tab.id);
        } else if (greeting === "add_xhr") {
          const { http } = request;
          if (http) {
            if (http.req.url.includes("/api/permission/batch_get_attribute")) {
              console.log("qqdocs keys");
              console.log(http.req.url);
              console.log(Object.keys(JSON.parse(http.res.body).result.attribute_info))
              removeData('-qqdocs_file_list', db)
              set('-qqdocs_file_list', Object.keys(JSON.parse(http.res.body).result.attribute_info), db);
            }
            addData(port.sender.tab.id, http.req, db);
          } else {
            console.log(request);
          }
        } else if (greeting === "get_xhr") {
          readData(port.sender.tab.id, db).then((result) => {
            const message = {
              greeting: "get_interface_list",
              data: result === undefined ? [] : result,
            };
            chrome.tabs.sendMessage(port.sender.tab.id, message);
          });
        } else if (greeting === "clean_all_interface") {
          removeAllInterfaceList(db);
        } else if (greeting === 'start_to_download_qq_docs_file') {
          const port = chrome.runtime.connect();
          console.log("in show_qq_docs_download_btn");
          readData("-qqdocs_file_list", db).then((docs_file_list) => {
            readData("-qqdocs_headers", db).then((docs_headers) => {
              console.log("------check--------");
              console.log(docs_file_list);
              console.log(docs_headers)
              const handleOneDownload = (url, index, FILE_CODE) => {
                console.log("有一个文件准备好了，开始下载:", url);
                const _data = {
                  type: "download_info",
                  info: {
                    count: docs_file_list.value.length,
                    current: FILE_CODE,
                    index: index + 1,
                    url: url,
                    err: null
                  },
                }
                console.log(_data);
                port.postMessage(_data);
              };
              exportFiles(docs_headers.value.Cookie, docs_file_list.value, handleOneDownload)
            });
          });

        } else if (greeting === "start_to_download_file") {
          const tabId = request.tabId;
          const port = chrome.runtime.connect();
          readData(tabId + "-kdoc_download_info", db).then((res) => {
            if (res === undefined || !res.value || res.value.length === 0) {
              port.postMessage({
                type: "download_info",
                info: {
                  count: -1,
                  current: -1,
                  index: -1,
                  url: null,
                  err: null
                },
              });
              return
            }
            readData(tabId + "-kdoc_download_info_headers", db).then(
              (headers) => {
                readData(tabId + "-kdoc_download_info_group_id", db).then(
                  (group_id) => {
                    res.value.forEach((fileId, index) => {
                      const config = {
                        headers: headers.value,
                        id: fileId,
                        group_id: group_id.value,
                        success: async (response) => {
                          if (response.url) {
                            port.postMessage({
                              type: "download_info",
                              info: {
                                count: res.value.length,
                                current: fileId,
                                index: index,
                                url: decodeURIComponent(decodeURIComponent(response.url)),
                                err: null
                              },
                            });
                          }
                        },
                        fail: (err) => {
                          port.postMessage({
                            type: "download_info",
                            info: {
                              count: res.value.length,
                              current: fileId,
                              index: index,
                              err: err,
                              url: null,
                            },
                          });
                          console.log(err);
                          console.log(fileId);
                        },
                      };
                      apiRequests.getAllDownloadFilePath(config);
                    });
                  }
                );
              }
            );
          });
        } else if (greeting === "clean_interface") {
          cleanData(port.sender.tab.id, db);
          const message = {
            greeting: "clean_interface_list",
          };
          chrome.tabs.sendMessage(port.sender.tab.id, message);
        } else if (greeting === "send_interface") {
          sendInterface(request, port.sender);
        } else if (greeting === "clean_xhr") {
          // Handle 'clean_xhr' logic
        } else if (greeting === "set_db") {
          set(request.key, request.value, db).then((res) => {
            postMessage(port, res);
          });
        } else if (greeting === "get_db") {
          readData(request.key, db)
            .then((res) => {
              if (res) {
                if (request.key === "k_doc_download_path") {
                  postMessage(port, res);
                } else {
                  postMessage(port, res.value);
                }
              } else {
                postMessage(port, res);
              }
            })
            .catch((e) => {
              console.log(e);
            });
        } else if (greeting === "remove_db") {
          removeData(request.key, db).then((res) => {
            postMessage(port, res);
          });
        }
      });
    });
  });
}

function postMessage(port, msg) {
  try {
    port.postMessage(msg);
  } catch (error) {
    console.log(error);
  }
}

function addListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (chrome.runtime.lastError) {
      console.error("Message failed to send:", chrome.runtime.lastError);
    }
    const { greeting } = request;
    if (greeting === "apiRequest") {
      sendHttpRequest(request, sender, sendResponse);
    }
    if (greeting === "clean_user_info") {
      resetGlobalParams(db);
    }
    if (greeting === "get_global_listener") {
      packGetGlobalListenerSwitch(db, sender);
    }
    if (greeting === "add_xhr") {
      const { http } = request;
      if (http) {
        addData(sender.tab.id, http.req, db);
      } else {
        console.log(request);
      }
    }

    if (greeting === "get_xhr") {
      readData(sender.tab.id, db).then((result) => {
        const message = {
          greeting: "get_interface_list",
          data: result === undefined ? [] : result,
        };
        chrome.tabs.sendMessage(sender.tab.id, message);
      });
    }

    if (greeting === "clean_all_interface") {
      removeAllInterfaceList(db);
    }

    if (greeting === "clean_interface") {
      cleanData(sender.tab.id, db);
      const message = {
        greeting: "clean_interface_list",
      };
      chrome.tabs.sendMessage(sender.tab.id, message);
    }

    if (greeting === "send_interface") {
      sendInterface(request, sender);
    }

    if (greeting === "clean_xhr") {
    }

    if (greeting === "set_db") {
      set(request.key, request.value, db).then((res) => {
        sendResponse(res);
      });
    }
    if (greeting === "get_db") {
      readData(request.key, db)
        .then((res) => {
          if (res) {
            sendResponse(res.value);
          } else {
            sendResponse(res);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    }
    if (greeting === "remove_db") {
      removeData(request.key, db).then((res) => {
        sendResponse(res);
      });
    }
    return true;
  });
}

installed();
initDB();

// setInterval(() => {
//   createNotification();
// }, 5000);
// function createNotification() {
//   // 创建通知
//   chrome.notifications.create(`my-notification-${Date.now()}`, {
//     type: "basic",
//     iconUrl: "/images/app.png",
//     title: "提醒",
//     message: "这是一个提醒消息",
//   });
// }
