import { storageHandle } from '@/api/storage'

export async function getGlobalListenerSwitch() {
  let result = await storageHandle.get('global_listener')
  if (result === undefined) {
    result = await storageHandle.set('global_listener', 1)
  }
  return result
}

export async function auth_and_get_headers(router) {
  const user = await storageHandle.get('user')
  const isLogin = await storageHandle.get('isLogin')
  if (user) {
    const _data = JSON.parse(user)
    const _result = {
      Authorization: 'token=' + _data.token
    }
    return _result
  } else if (!user || !isLogin || isLogin === 0) {
    router.push('/login')
  }
}
