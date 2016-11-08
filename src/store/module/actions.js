import pick from 'lodash/pick'
import keys from 'lodash/keys'
import size from 'lodash/size'
import find from 'lodash/find'
import axios from 'axios'
import {
  REMOVE_LANGUAGE_PERSISTENCY,
  UPDATE_I18N_STATE,
  CHANGE_LANGUAGE,
  SET_TRANSLATION,
  SET_TRANSLATION_ERROR
} from './events'

export default {
  [REMOVE_LANGUAGE_PERSISTENCY]: ({ commit }) => {
    commit(REMOVE_LANGUAGE_PERSISTENCY)
  },

  /**
   * This action will merge all parameter that are passed to the plugin with existing
   * parameter in the default state of the store.
   * No new parameters are allowed: they will simply be ignored.
   */
  [UPDATE_I18N_STATE]: async ({ commit, state }, payload) => {
    const params = (payload && payload.then) ? await payload : payload
    const availableKeys = keys(state)
    const newKeys = params

    if (size(newKeys) === 0) {
      return
    }

    const parsedParams = pick(newKeys, availableKeys)

    commit(UPDATE_I18N_STATE, parsedParams)
  },

  [SET_TRANSLATION]: async ({ commit, state }, code) => {
    const { path, languages, defaultCode } = state
    const language = find(languages, { code: code || defaultCode })
    const url = `${path}/${language.translateTo}.json`

    try {
      const { data } = await axios.get(url)
      commit(SET_TRANSLATION, data)

      return data
    } catch (e) {
      let message = `${e.message} for ${url}`

      if (e.response.status === 404) {
        message = `Problems with the translation json file. It doesn't exist (${url})`
      }

      commit(SET_TRANSLATION_ERROR, message)
      return
    }
  },

  [CHANGE_LANGUAGE]: async ({ dispatch, commit, state }, code) => {
    const { currentLanguage } = state

    if (code && (currentLanguage && currentLanguage.code === code)) {
      return
    }

    commit(CHANGE_LANGUAGE, code)

    return await dispatch(SET_TRANSLATION, code)
  }
}
