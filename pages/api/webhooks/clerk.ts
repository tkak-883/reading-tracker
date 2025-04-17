import { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { buffer } from 'micro';
import { supabase } from '../../../lib/supabase';

// body-parserを無効化（Webhookの生データを取得するため）
export const config = {
  api: {
    bodyParser: false,
  },
};

// Webhookのシークレット（.env.localに設定）
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // リクエストボディを取得
  const payload = (await buffer(req)).toString();
  const headers = req.headers;

  // Svixヘッダーを取得
  const svixId = headers['svix-id'] as string;
  const svixTimestamp = headers['svix-timestamp'] as string;
  const svixSignature = headers['svix-signature'] as string;

  // ヘッダーが不足している場合はエラー
  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing Svix headers' });
  }

  // Webhookを検証
  let evt;
  try {
    const wh = new Webhook(webhookSecret);
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: any };
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Invalid webhook' });
  }

  // イベントタイプに応じた処理
  try {
    const eventType = evt.type;

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
    }

    // 成功レスポンス
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ユーザー作成時の処理
async function handleUserCreated(data: any) {
  const { id, email_addresses, username } = data;
  const email = email_addresses[0]?.email_address;

  if (!email) return;

  try {
    // Supabaseにユーザーを作成
    const { error } = await supabase.from('users').insert([
      {
        clerk_id: id,
        email,
        username: username || email.split('@')[0],
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user in Supabase:', error);
    throw error;
  }
}

// ユーザー更新時の処理
async function handleUserUpdated(data: any) {
  const { id, email_addresses, username } = data;
  const email = email_addresses[0]?.email_address;

  if (!email) return;

  try {
    // Supabaseのユーザーを更新
    const { error } = await supabase
      .from('users')
      .update({
        email,
        username: username || email.split('@')[0],
      })
      .eq('clerk_id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user in Supabase:', error);
    throw error;
  }
}

// ユーザー削除時の処理
async function handleUserDeleted(data: any) {
  const { id } = data;

  try {
    // ユーザーIDでSupabaseのユーザーを検索
    const { data: userData, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', id)
      .single();

    if (findError) throw findError;

    // 読書ステータスを削除
    await supabase
      .from('reading_status')
      .delete()
      .eq('user_id', userData.id);

    // 書籍を削除
    await supabase
      .from('books')
      .delete()
      .eq('user_id', userData.id);

    // ユーザーを削除
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', id);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting user from Supabase:', error);
    throw error;
  }
}