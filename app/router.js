"use strict";

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // 模板相关接口
  app.resources("/templates", controller.templates);
  /** 获取模板id */
  router.get("/templateid", controller.templates.getTemplateId);

  router.post("/pipeline/publish", controller.pipeline.publish);
  router.post("/pipeline/pageList", controller.pipeline.pageList);
  // 模板生成页面相关接口
  router.post(
    "/pipeline/prepareFromTemplate",
    controller.pipeline.prepareFromTemplate
  );
  router.post("/pipeline/prepareFromPage", controller.pipeline.prepareFromPage);
  router.post(
    "/pipeline/prepareForRelease",
    controller.pipeline.prepareForRelease
  );
  router.get("/pipeline/baseConfig", controller.pipeline.getBaseConfig);
  router.put("/pipeline/baseConfig", controller.pipeline.putBaseConfig);
  router.get(
    "/pipeline/baseConfigSchema",
    controller.pipeline.getBaseConfigSchema
  );
  router.get(
    "/pipeline/templateComponents",
    controller.pipeline.getTemplateComponents
  );
  router.put(
    "/pipeline/templateComponents",
    controller.pipeline.putTemplateComponents
  );
  router.get(
    "/pipeline/libraryComponentsInfo",
    controller.pipeline.getLibraryComponentsInfo
  );
  router.get(
    "/pipeline/componentsSchema",
    controller.pipeline.getComponentsSchema
  );
  router.get(
    "/pipeline/componentsDefaultData",
    controller.pipeline.getComponentsDefaultData
  );
  // 删除模板
  router.post(
      '/pipeline/remove',
      controller.pipeline.remove
  );
  // 文件上传
  router.post("/file/upload", controller.file.upload);
  // 更新历史page的模板
  router.post("/page/upload", controller.page.upload);
  // 拷贝模板
  router.post("/page/copypage", controller.page.copypage);

  router.get("/", controller.home.index);
};
