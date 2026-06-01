import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId, name, subject, message, type } = body;

    if (!clinicId || !name || !subject || !message) {
      return NextResponse.json(
        { error: 'البيانات ناقصة' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // حفظ الرسالة في قاعدة البيانات
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        clinic_id: clinicId,
        name,
        subject,
        message,
        type: type || 'support',
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json(
        { error: 'معرف العيادة مفقود' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
