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
        this.version = '0.0.1';
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
    _doLPLAct(users, lplParams) {
        lplParams.forEach(param => {
            const { name, endTime, startTime, game_type, room_id } = param;
            const now = Date.now();
            if (now > startTime && now < endTime) {
                users.forEach((user) => {
                    if (!user.userData['doActTask'])
                        return;
                    const actLPLSgin = `${name}签到`;
                    const actAPI1 = {
                        method: 'POST',
                        uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchSign`,
                        body: `room_id=${room_id}&game_type=${game_type}&csrf_token=${plugin_1.tools.getCookie(user.jar, 'bili_jct')}&csrf=${plugin_1.tools.getCookie(user.jar, 'bili_jct')}`,
                        jar: user.jar,
                        json: true
                    };
                    plugin_1.tools.XHR(actAPI1).then(actAPI1Callback => {
                        if (actAPI1Callback !== undefined && actAPI1Callback.response.statusCode === 200)
                            plugin_1.tools.Log(user.nickname, '活动任务', actLPLSgin, '已完成');
                    });
                    const actLPLShare = `${name}分享`;
                    const actAPI2 = {
                        method: 'POST',
                        uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchShare`,
                        body: `game_type=${game_type}&csrf_token=${plugin_1.tools.getCookie(user.jar, 'bili_jct')}&csrf=${plugin_1.tools.getCookie(user.jar, 'bili_jct')}`,
                        jar: user.jar,
                        json: true
                    };
                    plugin_1.tools.XHR(actAPI2).then(actAPI2Callback => {
                        if (actAPI2Callback !== undefined && actAPI2Callback.response.statusCode === 200) {
                            plugin_1.tools.Log(user.nickname, '活动任务', actLPLShare, '已完成');
                        }
                    });
                });
            }
        });
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
