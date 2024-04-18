import _ from 'lodash';

import Request from '@/lib/request/Request.ts';
import Response from '@/lib/response/Response.ts';
import chat from '@/api/controllers/chat.ts';
import logger from '@/lib/logger.ts';

export default {

    prefix: '/v1/chat',

    post: {

        '/completions': async (request: Request) => {
            request
                .validate('body.messages', _.isArray)
                .validate('headers.authorization', _.isString)
            // refresh_token切分
            const tokens = chat.tokenSplit(request.headers.authorization);
            // 随机挑选一个refresh_token
            const token = _.sample(tokens);
            // 使用 temperature 控制模型不输出检索过程
            const temperature = request.body.temperature;
            let model = request.body.model;
            if (temperature !== undefined && temperature === 0 && model.indexOf('silent_search') === -1) {
                model += '_silent_search';
            }
            const messages =  request.body.messages;
            if (request.body.stream) {
                const stream = await chat.createCompletionStream(model, messages, token, request.body.use_search);
                return new Response(stream, {
                    type: "text/event-stream"
                });
            }
            else
                return await chat.createCompletion(model, messages, token, request.body.use_search);
        }

    }

}
