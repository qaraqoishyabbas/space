export default defineEventHandler(async event => {
  const query = getQuery(event);
  const username = typeof query.username === 'string' ? query.username.trim() : '';

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'username is required',
    });
  }

  const config = useRuntimeConfig();
  const apiKey = config.lastfmApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing lastfmApiKey in runtimeConfig',
    });
  }

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', 'user.getrecenttracks');
  url.searchParams.set('user', username);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('limit', '1');
  url.searchParams.set('format', 'json');

  const data = await $fetch(url.toString());

  return {
    ok: true,
    user: username,
    recentTracks: data,
  };
});
