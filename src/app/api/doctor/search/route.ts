// app/api/doctors/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DoctorProfile } from '@/models/DoctorProfile';

export async function GET(req: NextRequest) {
  await connectDB();
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const specialty = url.searchParams.get('specialty') || '';
  const city = url.searchParams.get('city') || '';
  const minExp = Number(url.searchParams.get('minExp') || 0);
  const langs = (url.searchParams.get('languages') || '').split(',').filter(Boolean);
  const accepting = url.searchParams.get('accepting');

  const filter: any = {};
  if (q) filter.$text = { $search: q };
  if (specialty) filter.specialty = specialty;
  if (city) filter.city = city;
  if (minExp) filter.yearsExperience = { $gte: minExp };
  if (langs.length) filter.languages = { $all: langs };
  if (accepting === 'true') filter.acceptingNewPatients = true;

  const page = Number(url.searchParams.get('page') || 1);
  const size = Number(url.searchParams.get('size') || 10);
  const items = await DoctorProfile
    .find(filter)
    .select('user specialty subSpecialties yearsExperience city languages acceptingNewPatients consultationFee')
    .populate({ path: 'user', select: 'name email' })
    .skip((page - 1) * size)
    .limit(size)
    .lean();

  const out = items.map((d:any) => ({
    id: String(d.user?._id),
    name: d.user?.name,
    email: d.user?.email,
    specialty: d.specialty,
    subSpecialties: d.subSpecialties,
    yearsExperience: d.yearsExperience,
    city: d.city,
    languages: d.languages,
    acceptingNewPatients: d.acceptingNewPatients,
    consultationFee: d.consultationFee
  }));

  return NextResponse.json(out);
}
