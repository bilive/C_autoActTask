import Plugin, { tools } from '../../plugin'

class AutoActTask extends Plugin {
    constructor() {
        super()
    }

    public name = '自动活动任务'
    public description = '每天自动进行活动任务（不定期任务）'
    public version = '0.0.2'
    public author = 'ShmilyChen'
    private _eventInfo!: EventInfo

    public async load({ defaultOptions, whiteList }: { defaultOptions: options, whiteList: Set<string> }) {
        // 自动签到
        defaultOptions.newUserData['doActTask'] = false
        defaultOptions.info['doActTask'] = {
            description: '自动活动任务',
            tip: '每天自动进行活动任务',
            type: 'boolean'
        }
        whiteList.add('doActTask')
        this.loaded = true
    }

    public async start({ users }: { users: Map<string, User> }) {
        await this._getEventInfo()
        this._doActTask(users)
    }

    public async loop({ cstMin, cstHour, users }: { cstMin: number, cstHour: number, users: Map<string, User> }) {
        // 每天04:30, 12:30, 20:30做任务
        if (cstMin === 30 && cstHour % 8 === 4) {
            await this._getEventInfo()
            this._doActTask(users)
        }
    }

    private _doActTask(users: Map<string, User>) {
        const eventInfo = this._eventInfo
        for (const key in eventInfo) {
            switch (key) {
                case "lpl_task":
                    this._doLPLAct(users, eventInfo[key])
                    break
                default:
                    break
            }
        }
    }

    /**
     * 自动lpl类型任务任务
     *
     * @private
     * @memberof AutoActTask
     */
    private async _doLPLAct(users: Map<string, User>, lplParams: lplParams[]) {
        for (const param of lplParams) {
            const { name, endTime, startTime, game_type, room_id, send, sgin, share } = param
            const now: number = Date.now()
            if (now > startTime && now < endTime) {
                for (const userArr of users) {
                    const user: User = userArr[1]
                    if (!user.userData['doActTask']) return
                    const csrf_token = tools.getCookie(user.jar, 'bili_jct')
                    // 用户签到
                    if (sgin && sgin !== undefined) {
                        const actLPLSgin = `${name}签到`
                        const actAPISgin: XHRoptions = {
                            method: 'POST',
                            uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchSign`,
                            body: `room_id=${room_id}&game_type=${game_type}&csrf_token=${csrf_token}&csrf=${csrf_token}`,
                            jar: user.jar,
                            json: true
                        }
                        tools.XHR<taskXHR>(actAPISgin).then(actAPI1Callback => {
                            if (actAPI1Callback !== undefined && actAPI1Callback.response.statusCode === 200)
                                tools.Log(user.nickname, '活动任务', actLPLSgin, '已完成')
                        })
                    }
                    // 用户分享
                    if (share && share !== undefined) {
                        const actLPLShare = `${name}分享`
                        const actAPIShare: XHRoptions = {
                            method: 'POST',
                            uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchShare`,
                            body: `game_type=${game_type}&csrf_token=${csrf_token}&csrf=${csrf_token}`,
                            jar: user.jar,
                            json: true
                        }
                        tools.XHR<taskXHR>(actAPIShare).then(actAPI2Callback => {
                            if (actAPI2Callback !== undefined && actAPI2Callback.response.statusCode === 200) {
                                tools.Log(user.nickname, '活动任务', actLPLShare, '已完成')
                            }
                        })
                    }
                    // 用户发送弹幕
                    if (send !== 0 && send !== undefined) {
                        const actLPLSend = `${name}发送弹幕`
                        let count: number = 1
                        let temp: number = 0
                        while (count <= send) {
                            const actAPISend: XHRoptions = {
                                method: 'POST',
                                uri: `https://api.live.bilibili.com/msg/send`,
                                body: `msg=${count}&roomid=${room_id}&color=16777215&fontsize=25&mode=1&rnd=${Math.round(Date.now() / 1000)}&bubble=0&csrf_token=${csrf_token}&csrf=${csrf_token}`,
                                jar: user.jar,
                                json: true
                            }
                            const sendInfo = await tools.XHR<taskXHR>(actAPISend)
                            if (sendInfo !== undefined && sendInfo.response.statusCode === 200 && sendInfo.body.code === 0 && sendInfo.body.msg === '') {
                                count++
                            }
                            else if (sendInfo !== undefined && sendInfo.response.statusCode === 200 && sendInfo.body.code === 0 && sendInfo.body.msg === '系统升级中') break
                            else if (sendInfo !== undefined && sendInfo.body.code === 1001) break
                            if (temp++ > send + 10) break
                            await tools.Sleep(3 * 1000)
                        }
                        if (count <= send) {
                            tools.Log(user.nickname, '活动任务', actLPLSend, '未完成，特殊原因停止任务')
                        } else {
                            tools.Log(user.nickname, '活动任务', actLPLSend, '已完成')
                        }
                    }
                }
            }
        }
    }

    private async _getEventInfo() {
        const url: XHRoptions = {
            url: `https://gitee.com/ShmilyLtt/blive/raw/config/EventInfo.json`,
            json: true
        }
        await tools.XHR<EventInfo>(url).then(eventInfoCallback => {
            if (eventInfoCallback !== undefined && eventInfoCallback.response.statusCode === 200)
                this._eventInfo = eventInfoCallback.body
        })
    }
}

interface taskXHR {
    code: number
    msg: string
    ttl: number
}

interface EventInfo {
    lpl_task: lplParams[]
}

interface lplParams {
    name: string
    room_id: number
    id: number
    game_type: number
    sgin: boolean
    share: boolean
    send: number
    startTime: number
    endTime: number
}

export default new AutoActTask()
