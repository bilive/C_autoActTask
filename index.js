"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = __importStar(require("../../plugin"));
class AutoActTask extends plugin_1.default {
    constructor() {
        super();
        this.name = '自动活动任务';
        this.description = '每天自动进行活动任务（不定期任务）';
        this.version = '0.0.2';
        this.author = 'ShmilyChen';
    }
    async load({ defaultOptions, whiteList }) {
        defaultOptions.newUserData['doActTask'] = false;
        defaultOptions.info['doActTask'] = {
            description: '自动活动任务',
            tip: '每天自动进行活动任务',
            type: 'boolean'
        };
        whiteList.add('doActTask');
        this.loaded = true;
    }
    async start({ users }) {
        await this._getEventInfo();
        this._doActTask(users);
    }
    async loop({ cstMin, cstHour, users }) {
        if (cstMin === 30 && cstHour % 8 === 4) {
            await this._getEventInfo();
            this._doActTask(users);
        }
    }
    _doActTask(users) {
        const eventInfo = this._eventInfo;
        for (const key in eventInfo) {
            switch (key) {
                case "lpl_task":
                    this._doLPLAct(users, eventInfo[key]);
                    break;
                default:
                    break;
            }
        }
    }
    async _doLPLAct(users, lplParams) {
        for (const param of lplParams) {
            const { name, endTime, startTime, game_type, room_id, send, sgin, share, sendMsg } = param;
            const now = Date.now();
            if (now > startTime && now < endTime) {
                for (const userArr of users) {
                    const user = userArr[1];
                    if (!user.userData['doActTask'])
                        return;
                    const csrf_token = plugin_1.tools.getCookie(user.jar, 'bili_jct');
                    if (sgin && sgin !== undefined) {
                        const actLPLSgin = `${name}签到`;
                        const actAPISgin = {
                            method: 'POST',
                            uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchSign`,
                            body: `room_id=${room_id}&game_type=${game_type}&csrf_token=${csrf_token}&csrf=${csrf_token}`,
                            jar: user.jar,
                            json: true
                        };
                        plugin_1.tools.XHR(actAPISgin).then(actAPI1Callback => {
                            if (actAPI1Callback !== undefined && actAPI1Callback.response.statusCode === 200)
                                plugin_1.tools.Log(user.nickname, '活动任务', actLPLSgin, '已完成');
                        });
                    }
                    if (share && share !== undefined) {
                        const actLPLShare = `${name}分享`;
                        const actAPIShare = {
                            method: 'POST',
                            uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchShare`,
                            body: `game_type=${game_type}&csrf_token=${csrf_token}&csrf=${csrf_token}`,
                            jar: user.jar,
                            json: true
                        };
                        plugin_1.tools.XHR(actAPIShare).then(actAPI2Callback => {
                            if (actAPI2Callback !== undefined && actAPI2Callback.response.statusCode === 200) {
                                plugin_1.tools.Log(user.nickname, '活动任务', actLPLShare, '已完成');
                            }
                        });
                    }
                    if (send !== 0 && send !== undefined) {
                        const actLPLSend = `${name}发送弹幕`;
                        let count = 1;
                        let temp = 1;
                        let msg = '';
                        while (count <= send) {
                            const actAPISend = {
                                method: 'POST',
                                uri: `https://api.live.bilibili.com/msg/send`,
                                body: `msg=${sendMsg === undefined ? '加油' : sendMsg}&roomid=${room_id}&color=16777215&fontsize=25&mode=1&rnd=${Math.round(Date.now() / 1000)}&bubble=0&csrf_token=${csrf_token}&csrf=${csrf_token}`,
                                jar: user.jar,
                                json: true
                            };
                            const sendInfo = await plugin_1.tools.XHR(actAPISend);
                            if (sendInfo !== undefined && sendInfo.response.statusCode === 200 && sendInfo.body.code === 0 && sendInfo.body.msg === '') {
                                count++;
                            }
                            else if (sendInfo !== undefined && sendInfo.response.statusCode === 200 && sendInfo.body.code === 0 && (sendInfo.body.msg === '系统升级中' || sendInfo.body.msg === '你被禁言啦')) {
                                msg = sendInfo.body.msg;
                                break;
                            }
                            else if (sendInfo !== undefined && (sendInfo.body.code === 1001 || sendInfo.body.code === 1003)) {
                                msg = sendInfo.body.msg;
                                break;
                            }
                            else {
                                if (sendInfo !== undefined) {
                                    msg = sendInfo.body.msg;
                                }
                            }
                            if (temp++ > send * 2)
                                break;
                            await plugin_1.tools.Sleep(3 * 1000);
                        }
                        if (count <= send) {
                            plugin_1.tools.Log(user.nickname, '活动任务', actLPLSend, `未完成，原因:${msg}`);
                        }
                        else {
                            plugin_1.tools.Log(user.nickname, '活动任务', actLPLSend, '已完成');
                        }
                    }
                }
            }
        }
    }
    async _getEventInfo() {
        const url = {
            url: `https://gitee.com/ShmilyLtt/blive/raw/config/EventInfo.json`,
            json: true
        };
        await plugin_1.tools.XHR(url).then(eventInfoCallback => {
            if (eventInfoCallback !== undefined && eventInfoCallback.response.statusCode === 200)
                this._eventInfo = eventInfoCallback.body;
        });
    }
}
exports.default = new AutoActTask();
