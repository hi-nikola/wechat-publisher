#!/usr/bin/env bash
# Source after configuring credentials privately; never echo secret values.
if [[ -z "${WECHAT_APP_ID:-}" || -z "${WECHAT_APP_SECRET:-}" ]]; then
    echo 'Configure WECHAT_APP_ID and WECHAT_APP_SECRET in your private environment.' >&2
    return 1 2>/dev/null || exit 1
fi
export WECHAT_APP_ID WECHAT_APP_SECRET
echo 'WeChat credential variables are configured (values hidden).'
