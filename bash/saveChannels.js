const youtubeApi = require('../libs/youtubeApi');
const config = require('../config');
const ChannelModel = require('../models/Channel');
const tinyHelper = require('../libs/tinyHelper');
const mongoHelper = require('../libs/mongoHelper');


async function saveChannelsInfo() {
  try {
    /* Wait for mongodb connection */
    const mongoConnection = await mongoHelper.getConnection();
  
    /* Get all channels' Id */
    const channelIds = await mongoHelper.getChannelIds();
  
    /*  Split an array to pieces and push then to an array */
    const splittedYoutubers = tinyHelper.splitArray(channelIds, 50);
  
    /* get lots of channels' info, but youtuber Api has limits, so we may need to query more than one time */
    const getChannelsPromises = [];
    splittedYoutubers.forEach((item) => {
      getChannelsPromises.push(youtubeApi.getChannels(item));
    });
    console.log('Calling youtube Api ' + getChannelsPromises.length + ' times');
  
    /* Each result even contains lots of results, so we do loop twice */
    const resFromChannelPromises = await Promise.all(getChannelsPromises);
    const channels = [];
    resFromChannelPromises.forEach((channelItems) => {
      channelItems.forEach((channelItem) => {
        channels.push(tinyHelper.encryptChannelInfo(channelItem));
      });
    });
  
    /* Use this index to check if all the promises done */
    let checkSaveEndIndex = 0;
    const channelsSize = channels.length;
    channels.forEach(async function (channel) {
      await mongoHelper.saveChannel(channel);
      checkSaveEndIndex += 1;
      if (checkSaveEndIndex === channelsSize) {
        mongoConnection.close();
      }
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = saveChannelsInfo;
