/*
 * 模板生成页面操作接口
 * @Author: CntChen
 * @Date: 2018-03-29
 */

'use strict';

const fs = require('fs');
const path = require('path');

const Controller = require('egg').Controller;

// 将组件库源码放入页面工作管道
// templateId 模板id
// pageId 当前预览页目录名
const makePagePipelineTemplate = async (context, templateId, pageId) => {
  const {
    ctx,
    config,
    service,
  } = context;
  // 通过templateId获取模板的数据
  const template = await service.db.queryTemplate({
    conditions: {
      id: templateId,
    },
  });
  // const template = {
  //   files: '/pipeline-resource/template/1/pipeline-template.zip',
  // };
  console.log('test', template, template.files, template.files);
  // 模板压缩文件路径
  const templateZipFilePath = path.join(config.resourcesPath.templateDir, template.files);
  // 预览文件夹路径
  const pagepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId);
  const templatepipelineDir = pagepipelineDir;
  // 解压
  await ctx.helper.execShell([
    `mkdir -p ${templatepipelineDir}`,
    `unzip -o ${templateZipFilePath} -d ${templatepipelineDir}`,
  ]);
};

// 在页面工作管道备份模板(页面)配置数据
const copyTemplateConfig = async (context, pageId) => {
  const {
    ctx,
    config,
  } = context;
  // 预览页路径
  const pagepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId);
  // 配置目录
  const templatepipelineDir = path.join(pagepipelineDir, 'server/config');
  const baseConfigpipelinePath = path.join(templatepipelineDir, 'base-config.json');
  const originBaseConfigpipelinePath = path.join(templatepipelineDir, 'base-config-origin.json');
  const templatepipelinePath = path.join(templatepipelineDir, 'components.json');
  const originTemplatepipelinePath = path.join(templatepipelineDir, 'components-origin.json');

  // 复制模板配置文件, 做为页面重置的数据来源
  await ctx.helper.execShell([
    `cp -rf ${baseConfigpipelinePath} ${originBaseConfigpipelinePath}`,
    `cp -rf ${templatepipelinePath} ${originTemplatepipelinePath}`,
  ]);
};

/**
 * 基于模板构建页面工作管道
 * @param {object} context 请求上下文
 * @param {string} templateId 模板id
 * @param {string} pageId 当前编辑发布页id
 */

const makePagepipelineFromTemplate = async (context, templateId, pageId) => {
  const {
    ctx,
  } = context;

  await makePagePipelineTemplate(context, templateId, pageId);
  // 备份pageId页面的配置
  await copyTemplateConfig(context, pageId);
  // 启动模板预览页面服务
  await ctx.helper.execShell([
    `cd ./app/public/pipelines/${pageId}/server`,
    'node node.js preview',
  ]);
};

// 基于页面构建页面工作管道
const makePagepipelineFromPage = async (context, templateId, pageId) => {
  const {
    ctx,
    config,
    service,
  } = context;

  const page = await service.page.getPageById(pageId);

  const pageZipFilePath = path.join(config.resourcesPath.pageDir, page.files);
  const pagepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId);
  const templatepipelineDir = path.join(pagepipelineDir, 'server/config');

  await makePagePipelineTemplate(context, templateId, pageId);
  await ctx.helper.execShell([`unzip -o ${pageZipFilePath} -d ${templatepipelineDir}`]);
  await copyTemplateConfig(context, pageId);
  await ctx.helper.execShell([
    `cd ./app/public/pipelines/${pageId}/server`,
    'node node.js preview',
  ]);
};

// 构建用于发布页面源码
// const makePageActivity = async(context, pageId) => {
//     const {
//         ctx,
//         config,
//     } = context;
//     const pagepipelineServerDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server');
//     const pageActivityDir = path.join(config.baseDir, 'app/public/activities', pageId);
//
//     // 复制 pipelines 到 activities, 并执行页面发布的构建
//     await ctx.helper.execShell([
//         `mkdir -p ${pageActivityDir}`,
//         `cp -rf ${pagepipelineServerDir} ${pageActivityDir}`,
//         `cd ./app/public/activities/${pageId}/server`,
//         'node node.js release',
//     ]);
//
//     // 基于 dist 创建纯净的发布目录
//     await ctx.helper.execShell([
//         `mkdir -p ./app/public/activities/${pageId}/${pageId}`,
//         `cp -rf ./app/public/activities/${pageId}/server/dist/* ./app/public/activities/${pageId}/${pageId}`,
//         `cd ./app/public/activities/${pageId}/${pageId}`,
//         'rm -f index-origin.html',
//         'rm -f vue-ssr-server-bundle.json',
//         'rm -f vue-ssr-client-manifest.json',
//     ]);
// };
const makePageActivity = async (context, pageId) => {
  const {
    ctx,
    config,
  } = context;
  const pagepipelineServerDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server');

  const pageActivityDir = path.join(config.baseDir, 'app/public/activities', pageId);
  const timestamp = Date.now();
  // 复制 pipelines 到 activities, 并执行页面发布的构建
  await ctx.helper.execShell([
    `mkdir -p ${pageActivityDir}`,
    `cp -rf ${pagepipelineServerDir} ${pageActivityDir}`,
    `cd ./app/public/activities/${pageId}/server`,
    `node node.js release ${timestamp}`,
  ]);

  // 基于 dist 创建纯净的发布目录
  await ctx.helper.execShell([
    `rm -rf ./app/public/activities/${pageId}/static/`,
    `mkdir -p ./app/public/activities/${pageId}/static/${timestamp}`,
    `cp -rf ./app/public/activities/${pageId}/server/dist/* ./app/public/activities/${pageId}/static/${timestamp}`,
    `cd ./app/public/activities/${pageId}/static/${timestamp}`,
    'rm -f index-origin.html',
    'rm -f vue-ssr-server-bundle.json',
    'rm -f vue-ssr-client-manifest.json',
    `cd ${pageActivityDir}`,
    'zip -q -r static.zip static',
  ]);
};
// 发布静态资源到CDN
const publishCDN = async function publishCDN(context, pageId) {
  const {ctx, config} = context;
  const staticFile = path.join(config.baseDir, 'app/public/activities', pageId, 'static.zip');
  const result = await ctx.curl('http://preapi.geinihua.com/upload', {
    method: 'POST',
    files: {
      project: staticFile
    }
  });
  // error handler


}
// 将构建之后的html入口页面push到远程仓库 触发 webhooks 发布到nginx服务器上
const pushToRegistry = async function pushToRegistry(context, pageId) {
  const {ctx, config} = context;
  const gitRepositoryDir = config.gitRepositoryDir;
  const pageActivityHtml = path.join(config.baseDir, 'app/public/activities', pageId, 'server/dist/index.html');
  await ctx.helper.execShell([
    `cd ${gitRepositoryDir}`,
    `mkdir -p sparrow-activity-published/${pageId}`,
    `cp ${pageActivityHtml} sparrow-activity-published/${pageId}`,
    `cd sparrow-activity-published`,
    `git add .`,
    `git commit -m 'add ${pageId}' || true`,
    `git push -f`
  ]);
}

class EditController extends Controller {
  /**
   * 发布页面
   * @return {Promise<void>}
   */
  async publish() {
    const {ctx} = this;
    const {pageId} = ctx.request.body;
    // 执行构建
    await makePageActivity(this, pageId);
    // 发布静态资源到CDN

    await publishCDN(this, pageId);
    // push到git仓库
    try {
      await pushToRegistry(this, pageId);
    } catch (e) {
      console.log(e, e === 'Everything up-to-date');
      if (e === 'Everything up-to-date') {
        ctx.body = {
          pageId
        }
      } else {
        //error
        ctx.body = {
          pageId
        }
      }
    }
  }

  /**
   * 获取历史page list
   * @return {Promise<void>}
   */
  async pageList() {
    const {
      ctx,
    } = this;
    const listStr = await ctx.helper.execShell([
      `ls ./app/public/pipelines/`,
    ]);
    const list = listStr.split("\n").filter(item => !!item)
    .map((item, index) => {
      return {
        id: index,
        pageId: item
      }
    }).reverse();

    ctx.body = {
      list
    }
  }

  /**
   * 根据templateId 生成预览页
   * 1. 创建预览页所在目录
   * 2. 解压模板到预览页目录
   * 3. 启动预览页服务
   */
  async prepareFromTemplate() {
    const {
      ctx,
    } = this;
    const templateId = ctx.request.body.templateId;

    // 生成页面ID: timeStamp + 00 + 2位随机数
    // 用来存储编辑模板
    const timeStranpStr = new Date().getTime();
    const randomStr = Math.random().toString().slice(-2);

    const pageId = `${timeStranpStr}00${randomStr}`;

    await makePagepipelineFromTemplate(this, templateId, pageId);

    ctx.body = {
      pageId,
    };
  }

  async prepareFromPage() {
    const {
      ctx,
    } = this;
    const pageId = ctx.request.body.pageId;
    await ctx.helper.execShell([
      `cd ./app/public/pipelines/${pageId}/server`,
      'node node.js preview',
    ]);
    ctx.body = {
      pageId
    };
  }

  async prepareFromPageA() {
    const {
      ctx,
      service,
    } = this;
    const pageId = ctx.request.body.pageId;

    const page = await service.page.getPageById(pageId);
    const templateId = page.templateId;

    await makePagepipelineFromPage(this, templateId, pageId);

    ctx.body = {
      pageId,
    };
  }

  async prepareForRelease() {
    const {
      ctx,
      service,
      config,
    } = this;
    const pageId = ctx.request.body.pageId;
    const page = await service.page.getPageById(pageId);
    const templateId = page.templateId;

    const pageActivityDir = path.join(config.baseDir, 'app/public/activities', pageId);
    const pagepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId);

    const pagepipelineDirStat = await ctx.helper.file.fsStat(pagepipelineDir).catch(e => e);
    if (pagepipelineDirStat instanceof Error) {
      await makePagepipelineFromTemplate(this, templateId, pageId);
    }
    const pageActivityDirStat = await ctx.helper.file.fsStat(pageActivityDir).catch(e => e);
    if (pageActivityDirStat instanceof Error) {
      await makePageActivity(this, pageId);
    }

    ctx.body = {
      pageId,
    };
  }

  async getBaseConfig() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.query.pageId;

    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const dataPath = path.join(templatepipelineDir, 'base-config.json');
    const dataStr = fs.readFileSync(dataPath, 'utf-8');
    const content = JSON.parse(dataStr);
    ctx.body = content;
  }

  async putBaseConfig() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.request.body.pageId;
    const baseConfig = ctx.request.body.baseConfig;
    const baseConfigStr = JSON.stringify(baseConfig, null, 2);
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const baseConfigPath = path.join(templatepipelineDir, 'base-config.json');
    fs.writeFileSync(baseConfigPath, baseConfigStr, 'utf-8');
    await ctx.helper.execShell([
      'pwd',
      `cd ./app/public/pipelines/${pageId}/server`,
      'node node.js preview',
    ]);
    ctx.body = '修改页面基本配置成功.';
  }

  async getBaseConfigSchema() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.query.pageId;
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const schemaPath = path.join(templatepipelineDir, 'base-config-schema.json');
    const schemaStr = fs.readFileSync(schemaPath, 'utf-8');
    const content = JSON.parse(schemaStr);
    ctx.body = content;
  }

  async getTemplateComponents() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.query.pageId;
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const dataPath = path.join(templatepipelineDir, 'components.json');
    const dataStr = fs.readFileSync(dataPath, 'utf-8');
    const content = JSON.parse(dataStr);
    ctx.body = content;
  }

  async putTemplateComponents() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.request.body.pageId;
    const templateComponents = ctx.request.body.templateComponents;
    const templateComponentsStr = JSON.stringify(templateComponents, null, 2);
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const templateComonentsPath = path.join(templatepipelineDir, 'components.json');
    fs.writeFileSync(templateComonentsPath, templateComponentsStr, 'utf-8');
    await ctx.helper.execShell([
      `cd ./app/public/pipelines/${pageId}/server`,
      'node node.js preview',
    ]);
    ctx.body = '修改页面组件列表成功';
  }

  async getComponentsSchema() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.query.pageId;
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const schemaPath = path.join(templatepipelineDir, 'components-schema.json');
    const schemaStr = fs.readFileSync(schemaPath, 'utf-8');
    const content = JSON.parse(schemaStr);
    ctx.body = content;
  }

  async getLibraryComponentsInfo() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.query.pageId;
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const componentsInfoPath = path.join(templatepipelineDir, 'components-info.json');
    const componentsInfoStr = fs.readFileSync(componentsInfoPath, 'utf-8');
    const content = JSON.parse(componentsInfoStr);

    ctx.body = content;
  }

  async getComponentsDefaultData() {
    const {
      ctx,
      config,
    } = this;
    const pageId = ctx.query.pageId;
    const templatepipelineDir = path.join(config.baseDir, 'app/public/pipelines', pageId, 'server/config');
    const componentsDefaultDataPath = path.join(templatepipelineDir, 'components-default-data.json');
    const componentsDefaultDataStr = fs.readFileSync(componentsDefaultDataPath, 'utf-8');
    const content = JSON.parse(componentsDefaultDataStr);
    console.log(componentsDefaultDataStr);
    ctx.body = content;
  }
}

module.exports = EditController;