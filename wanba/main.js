'use strict';

//var fs = require('fs');

var wanba_game_vsersion = "";
var wanba_game_out_path = "";
var wanba_game_name = "";
var ndkPath = "";
var targetPlatform = "";
var xxteaKey = "";
var isDebug = true;
var suportEncryptJs = true;

module.exports = {

  load() {
    // execute when package loaded
    wanba_game_name = Editor.projectInfo.name;
    wanba_game_out_path = Editor.projectPath + "/../../build/" + wanba_game_name;
    var path = require('path');
    wanba_game_out_path = path.normalize(wanba_game_out_path);
    Editor.log("wanba_game_out_path = ", wanba_game_out_path);

    var fs = require('fs');
    // ndkPath = fs.readFileSync(Editor.url('packages://wanba/ndkpath.txt', 'utf8'), 'utf-8');
    ndkPath = Editor.App.home.replace(/.CocosCreator/, "Library/Android/sdk/platform-tools/adb");
    Editor.log('ndkPath:', ndkPath);    //同步读取结束

    // Editor.log("Editor:\r\n",Editor);

    let versionArr = Editor.App.version.split('.');
    if(parseInt(versionArr[0]) <= 1 && parseInt(versionArr[1]) <= 5){
      suportEncryptJs = false;
      Editor.log(Editor.App.version + " not suport use custom encryptJs param");
    }

    Editor.log('load wanba package success');
  },

  unload() {
    // execute when package unloaded
    Editor.log('unload wanba package success');
  },

  // register your ipc messages here
  messages: {

    'build'(event, args) {
      // open entry panel registered in package.json
      if (this.checkParam(args)) {
        targetPlatform = "ios";
        this.build();
      };
    },

    'build_android'(event, args) {
      // open entry panel registered in package.json
      if (this.checkParam(args)) {
        targetPlatform = "android";
        this.buildAndroid();
      };
    },

    'repleace_android'(event, args) {
      // open entry panel registered in package.json
      if (this.checkParam(args)) {
        targetPlatform = "android";
        this.repleaceAndroid();
      };
    },

    'package_project'(event, args) {
      if (this.checkParam(args)) {
        targetPlatform = "ios";
        this.packageProject();
      };
    },
    
    'open_current_folder'() {
      this.openCurrentFolder();
    },

    'open'() {
      Editor.Panel.open('wanba');
    },
  },

  checkParam(args) {
    wanba_game_vsersion = args.version;
    xxteaKey = args.xxteaKey;
    Editor.log("打包的版本号为：", wanba_game_vsersion, "加密串为：", xxteaKey);
    this.createVersionFile();
    return true;
  },

  createVersionFile(args) {
    var path = require('path');
    let wanba_game_build = wanba_game_out_path + '/../';
    wanba_game_build = path.normalize(wanba_game_build);

    var fs = require('fs');
    if (!fs.existsSync(wanba_game_build)) {
      let res = fs.mkdirSync(wanba_game_build);
      Editor.log("create dir ", wanba_game_build);
    }

    if (!fs.existsSync(wanba_game_out_path)) {
      let res = fs.mkdirSync(wanba_game_out_path);
      Editor.log("create dir ", wanba_game_out_path);
    }

    //生成version
    let versionPath = wanba_game_out_path + "/version.json";
    let versionStr = '{\r\n    "version": "{version}",\r\n    "gameName": "{gameName}"\r\n}';
    versionStr = versionStr.replace(/{version}/g, wanba_game_vsersion);
    versionStr = versionStr.replace(/{gameName}/g, wanba_game_name);

    //创建vserion
    fs.writeFileSync(versionPath, versionStr);
    Editor.log("create version file success", versionPath);
  },

  excCommondAsync: function (command) {
    Editor.log("开始执行命令:", command);
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
      exec(command, { env: process.env }, (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
          Editor.log("执行命令完成，error", stderr);
        } else {
          resolve(stdout);
          Editor.log("执行命令完成，succes", stdout);
        }
      });
    });
  },

  async buildProject() {
    let commonStr = Editor.App.path;
    commonStr = commonStr.replace(/Resources/, "MacOS");
    commonStr = commonStr.replace(/app.asar/, "CocosCreator");
    commonStr += ' --path {projectPath} --build "{buildParamStr}"';
    commonStr = commonStr.replace(/{projectPath}/g, Editor.projectPath);

    let buildParamStr = 'platform={platform};debug={isDebug};template=default';

    buildParamStr = buildParamStr.replace(/{platform}/g, targetPlatform);

    //自定义加密脚本
    if(suportEncryptJs && !isDebug){
      let xxteaKeyStr = ';encryptJs=true;xxteaKey={xxteaKey};zipCompressJs=true';
      xxteaKeyStr = xxteaKeyStr.replace(/{xxteaKey}/g, xxteaKey);
      buildParamStr += xxteaKeyStr;
    }
    
    if (isDebug) {
      buildParamStr = buildParamStr.replace(/{isDebug}/g, "true");
    }
    else {
      buildParamStr = buildParamStr.replace(/{isDebug}/g, "false");
    }

    commonStr = commonStr.replace(/{buildParamStr}/g, buildParamStr);
    try {
      Editor.log('buildProject! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('buildProject! end');
    } catch (error) {
      Editor.log('buildProject! err');
    }
  },

  async moveToBuild() {
    //移动到build
    var path = require('path');
    let tempFrom = Editor.projectPath + "/build/jsb-default";
    tempFrom = path.normalize(tempFrom);
    let commonStr = 'rm -r -f {wanba_game_out_path}/res'
    commonStr += ' && rm -r -f {wanba_game_out_path}/src'
    commonStr += ' && cp -r -f {tempFrom}/res {wanba_game_out_path}/res';
    commonStr += ' && cp -r -f {tempFrom}/src {wanba_game_out_path}/src';
    commonStr = commonStr.replace(/{tempFrom}/g, tempFrom);
    commonStr = commonStr.replace(/{wanba_game_out_path}/g, wanba_game_out_path);
    
    try {
      Editor.log('moveToBuild! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('moveToBuild! end');
    } catch (error) {
      Editor.log('moveToBuild! err');
    }
  },

  async moveToAndroidPoject() {
    var path = require('path');
    let tempPath = Editor.projectPath + "/../../../android_src/app/assets/";
    tempPath = path.normalize(tempPath);

    let commonStr = 'cp -r -f {wanba_game_out_path} {tempPath}';
    commonStr = commonStr.replace(/{tempPath}/g, tempPath);
    commonStr = commonStr.replace(/{wanba_game_out_path}/g, wanba_game_out_path);

    try {
      Editor.log('moveToAndroidPoject! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('moveToAndroidPoject! end');
    } catch (error) {
      Editor.log('moveToAndroidPoject! err');
    }
  },

  async moveToAndroidMobilePhone() {
    // let ndkPath = Editor.App.home.replace(/.CocosCreator/, "Library/Android/sdk/platform-tools/adb");
    let targetPath = "/storage/emulated/0/Android/data/com.wodi.who/files/cocos/";
    //let targetPath = "/storage/emulated/legacy/Android/data/com.wodi.who/files/cocos";
    let commonStr = ndkPath + " shell rm -rf " + targetPath + wanba_game_name;
    commonStr += " && " + ndkPath + " push " + wanba_game_out_path + " " + targetPath;
    //删除多余的wanba_nurture_0.0.2.zip类似的文件
    commonStr += " && " + ndkPath + " shell rm -rf " + targetPath + wanba_game_name + "/wanba*.zip";
    Editor.log("开始替换游戏 到 android 手机", commonStr);

    try {
      Editor.log('moveToAndroidMobilePhone! begin');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('moveToAndroidMobilePhone! end');
    } catch (error) {
      Editor.log('moveToAndroidMobilePhone! err');
    }
  },

  async zipProject() {
    let commonStr = 'cd {wanba_game_out_path} && zip -P wanba_xiangbudao wanba_{gameName}_{version}.zip -r src/* res/* version.json'
    commonStr = commonStr.replace(/{wanba_game_out_path}/g, wanba_game_out_path);
    commonStr = commonStr.replace(/{gameName}/g, wanba_game_name);
    commonStr = commonStr.replace(/{version}/g, wanba_game_vsersion);
    
    try {
      Editor.log('zipProject! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('zipProject! end');
    } catch (error) {
      Editor.log('zipProject! err');
    }
  },

  async build() {
    Editor.log('build!', wanba_game_name);

    try {
      Editor.log('build! begin ');
      isDebug = true;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      Editor.log('build! end');
    } catch (error) {
      Editor.log('build! err');
    }

    Editor.log("构建完成 name:", wanba_game_name, " vserion:", wanba_game_vsersion);
  },

  async buildAndroid() {
    Editor.log('buildAndroid!', wanba_game_name);
    try {
      Editor.log('buildAndroid! begin ');
      isDebug = true;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      await Promise.resolve(this.moveToAndroidPoject());
      Editor.log('buildAndroid! end');
    } catch (error) {
      Editor.log('buildAndroid! err');
    }

    Editor.log("构建完成 name:", wanba_game_name, " vserion:", wanba_game_vsersion);
  },

  async repleaceAndroid() {
    Editor.log('repleaceAndroid!', wanba_game_name);
    try {
      Editor.log('repleaceAndroid! begin ');
      isDebug = true;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      await Promise.resolve(this.moveToAndroidMobilePhone());
      Editor.log('repleaceAndroid! end');
    } catch (error) {
      Editor.log('repleaceAndroid! err');
    }
    Editor.log("替换完成 name:", wanba_game_name, " vserion:", wanba_game_vsersion);
  },

  async packageProject() {
    Editor.log('packageProject', wanba_game_name);
    try {
      Editor.log('packageProject! begin ');
      isDebug = false;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      await Promise.resolve(this.zipProject());
      Editor.log('packageProject! end');
    } catch (error) {
      Editor.log('packageProject! err');
    }
    Editor.log("打包成功 name:", wanba_game_name, " vserion:", wanba_game_vsersion);
  },

  async openCurrentFolder(){
    Editor.log('open folder', Editor.projectPath);
    let commonStr = "open " + Editor.projectPath;
    try {
      Editor.log('openCurrentFolder! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('openCurrentFolder! end');
    } catch (error) {
      Editor.log('openCurrentFolder! err');
    }
    Editor.log("打开游戏文件夹完成 name:", wanba_game_name);
  },
};