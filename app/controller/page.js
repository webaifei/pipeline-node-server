"use strict";
const fs = require("fs");
const path = require("path");

const Controller = require("egg").Controller;

class PageController extends Controller {
  // 上传生成的dist 替换 历史页面中生成的dist文件夹
  async upload() {
    const { ctx, config } = this;

    const stream = await ctx.getFileStream();
    const pageId = stream.fields.pageId;
    const fileBuffer = await ctx.helper.upload.streamPromise(stream);
    const filePath = path.join(config.baseDir, "app/public/pipelines", pageId);
    console.log(filePath, 'filepath');

    // 替换之前 先备份一个
    await ctx.helper.execShell(
      `cp -rf ${filePath}/server/dist ${filePath}/server/dist.bak`
    );
    await ctx.helper.execShell(
      `cp -rf ${filePath}/server-bak/dist ${filePath}/server-bak/dist.bak`
    );
    // 存储临时文件
    fs.writeFileSync(`${filePath}/tmp`, fileBuffer);
    // 删除原有代码
    await ctx.helper.execShell(`rm -rf ${filePath}/server-bak/dist`);
    await ctx.helper.execShell(`rm -rf ${filePath}/server/dist`);
    // 解压替换
    await ctx.helper.execShell(
      `unzip -o ${filePath}/tmp -d ${filePath}/server/`
    );
    await ctx.helper.execShell(
      `unzip -o ${filePath}/tmp -d ${filePath}/server-bak/`
    );
    // 删除临时文件
    await ctx.helper.execShell(`rm ${filePath}/tmp`);
    this.ctx.body = {
      ret: 0,
      pageId,
    };
  }
  // 复制已经存在的活动页
  async copypage() {
    const { ctx, config } = this;
    // 获取参数
    const { pageId, pageName, templateId } = ctx.request.body;
    
    // 重新生成pageId
    const timeStranpStr = new Date().getTime();
    const randomStr = Math.random()
      .toString()
      .slice(-2);

    const newPageId = `${timeStranpStr}00${randomStr}`;
    const payload = { id: newPageId, templateId, name: pageName };
    const pagePath = path.join(config.baseDir, 'app/public/pipelines');
    // 拷贝新目录结构
    await ctx.helper.execShell([
      `cp -rf ${pagePath}/${pageId} ${pagePath}/${newPageId}`,
    ]);
    // 插入新纪录到库中
    // 插入数据库
    await ctx.service.activity.create({
      payload,
    });
    ctx.body = {
      ret: 0,
      pageId: newPageId,
    };
  }
}

module.exports = PageController;
