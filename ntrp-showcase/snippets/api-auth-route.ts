// 展示用途的擷取片段，非完整專案 — NextAuth 設定（Pages Router）
import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { pool } from '@/lib/db'  // 你的專案實際使用

// Discord 角色 ID 設定
const DISCORD_ROLES = {
  ADMIN: process.env.DISCORD_ADMIN_ROLE_IDS?.split(',') ?? [],
  DONOR: process.env.DISCORD_DONOR_ROLE_ID || '9876543210',
  WHITELISTED: process.env.DISCORD_WHITELISTED_ROLE_ID || '5555555555',
}

// 以 Bot Token 讀取使用者在 Guild 的角色
async function getUserRoles(discordId: string, _accessToken: string) {
  try {
    const guildId = process.env.DISCORD_GUILD_ID
    const botToken = process.env.DISCORD_BOT_TOKEN
    if (!guildId || !botToken) return []

    const resp = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    )
    if (!resp.ok) return []
    const member = await resp.json()
    return member.roles || []
  } catch {
    return []
  }
}

const adminRoleIds = (process.env.DISCORD_ADMIN_ROLE_IDS?.split(',') ?? []).map(id => id.trim())
const whitelistedRoleId = process.env.DISCORD_WHITELISTED_ROLE_ID?.trim() ?? ''

// 權限判斷
function checkPermissions(userRoles: string[]) {
  const clean = userRoles.map(r => r.trim())
  return {
    is_admin: clean.some(role => adminRoleIds.includes(role)),
    is_donor: clean.includes(DISCORD_ROLES.DONOR),
    is_whitelisted: clean.includes(whitelistedRoleId),
  }
}

// 資料庫 upsert
async function upsertUser(
  discordId: string,
  username: string,
  avatar: string,
  roles: string[],
  permissions: { is_admin: boolean; is_donor: boolean; is_whitelisted: boolean },
) {
  const sql = `
    INSERT INTO users (discord_id, username, avatar, roles, is_admin, is_donor, is_whitelisted, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (discord_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      avatar = EXCLUDED.avatar,
      roles = EXCLUDED.roles,
      is_admin = EXCLUDED.is_admin,
      is_donor = EXCLUDED.is_donor,
      is_whitelisted = EXCLUDED.is_whitelisted,
      updated_at = CURRENT_TIMESTAMP
  `
  await pool.query(sql, [
    discordId,
    username,
    avatar,
    roles,
    permissions.is_admin,
    permissions.is_donor,
    permissions.is_whitelisted,
  ])
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify email guilds.members.read' } },
      profile(p: any) {
        return {
          id: p.id,
          name: p.username || p.global_name || 'Unknown User',
          image: p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 首次登入：把基本資料放進 token
      const discordId = token.id || (profile as any)?.id || account?.providerAccountId
      const username =
        (profile as any)?.username || (profile as any)?.global_name || profile?.name || 'Unknown User'
      const avatar =
        (profile as any)?.avatar && discordId
          ? `https://cdn.discordapp.com/avatars/${discordId}/${(profile as any).avatar}.png`
          : ''

      if (account && profile) {
        token.id = discordId
        token.name = username
        token.image = avatar
        token.accessToken = account.access_token
        token.email =
          (typeof profile?.email === 'string' && profile.email) ||
          (typeof account?.email === 'string' && account.email) ||
          token.email
      }

      // 取得 Guild 角色 → 推導權限 → upsert DB → 寫回 token
      if (token.id && token.accessToken) {
        try {
          const roles = await getUserRoles(token.id as string, token.accessToken as string)
          const permissions = checkPermissions(roles)
          await upsertUser(token.id as string, (token.name as string) || username, token.image || avatar, roles, permissions)
          ;(token as any).roles = roles
          ;(token as any).permissions = permissions
        } catch {
        }
      }

      return token
    },
    async session({ session, token }) {
      ;(session.user as any).id = token.id
      ;(session.user as any).accessToken = (token as any).accessToken
      ;(session.user as any).roles = (token as any).roles
      ;(session.user as any).permissions = (token as any).permissions
      return session
    },
  },
}

export default NextAuth(authOptions)
