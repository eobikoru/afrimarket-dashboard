'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBps, formatUsd } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { RateMethod, RateZone, Settings } from '@/lib/types';
import { ErrorBanner, Field, Loading, PageHead } from './ui';

const ZONES = ['contiguous', 'ak_hi', 'territories'] as const;
const METHODS = ['standard', 'expedited'] as const;

type Draft = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingThresholdCents: string;
  coldPackSurchargeCents: string;
  announcementBar: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  taxFlatRateBps: string;
  rates: Record<(typeof ZONES)[number], { standard: RateMethod; expedited: RateMethod; overnight: RateMethod | null }>;
};

function methodOr(value: RateMethod | null | undefined): RateMethod {
  return value ?? { baseCents: 0, perPoundCents: 0 };
}

function fromSettings(row: Settings): Draft {
  return {
    storeName: row.storeName,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    freeShippingThresholdCents: String(row.freeShippingThresholdCents),
    coldPackSurchargeCents: String(row.coldPackSurchargeCents),
    announcementBar: row.announcementBar ?? '',
    instagram: row.socialLinks?.instagram ?? '',
    facebook: row.socialLinks?.facebook ?? '',
    tiktok: row.socialLinks?.tiktok ?? '',
    youtube: row.socialLinks?.youtube ?? '',
    defaultMetaTitle: row.defaultMetaTitle ?? '',
    defaultMetaDescription: row.defaultMetaDescription ?? '',
    taxFlatRateBps: String(row.taxFlatRateBps),
    rates: {
      contiguous: zone(row.shippingRates.contiguous),
      ak_hi: zone(row.shippingRates.ak_hi),
      territories: zone(row.shippingRates.territories),
    },
  };
}

function zone(value: RateZone) {
  return {
    standard: methodOr(value.standard),
    expedited: methodOr(value.expedited),
    overnight: value.overnight,
  };
}

export function SettingsView() {
  const { data, error, loading, reload } = useApi<Settings>('/admin/settings');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (data) setDraft(fromSettings(data));
  }, [data]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      const social = {
        instagram: draft.instagram.trim() || undefined,
        facebook: draft.facebook.trim() || undefined,
        tiktok: draft.tiktok.trim() || undefined,
        youtube: draft.youtube.trim() || undefined,
      };
      await api('/admin/settings', {
        method: 'PATCH',
        body: {
          storeName: draft.storeName.trim(),
          supportEmail: draft.supportEmail.trim(),
          supportPhone: draft.supportPhone.trim(),
          freeShippingThresholdCents: Number(draft.freeShippingThresholdCents),
          coldPackSurchargeCents: Number(draft.coldPackSurchargeCents),
          announcementBar: draft.announcementBar.trim() ? draft.announcementBar.trim() : null,
          socialLinks: social,
          defaultMetaTitle: draft.defaultMetaTitle.trim() ? draft.defaultMetaTitle.trim() : null,
          defaultMetaDescription: draft.defaultMetaDescription.trim() ? draft.defaultMetaDescription.trim() : null,
          taxFlatRateBps: Number(draft.taxFlatRateBps),
          shippingRates: draft.rates,
        },
      });
      reload();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  if (loading || !draft) return loading ? <Loading /> : <ErrorBanner error={error} />;

  function setRate(zoneName: (typeof ZONES)[number], method: 'standard' | 'expedited', key: keyof RateMethod, value: string) {
    setDraft((current) => {
      if (!current) return current;
      const cents = Number(value || 0);
      return {
        ...current,
        rates: {
          ...current.rates,
          [zoneName]: { ...current.rates[zoneName], [method]: { ...current.rates[zoneName][method], [key]: cents } },
        },
      };
    });
  }

  return (
    <>
      <PageHead kicker="Store" title="Settings" lede="Public store copy, shipping rates, and tax. Secrets stay on the server." />
      <ErrorBanner error={error ?? formError} />
      <form className="panel stack" onSubmit={save}>
        <div className="form-grid">
          <Field label="Store name"><input value={draft.storeName} onChange={(event) => setDraft({ ...draft, storeName: event.target.value })} required /></Field>
          <Field label="Support email"><input type="email" value={draft.supportEmail} onChange={(event) => setDraft({ ...draft, supportEmail: event.target.value })} required /></Field>
          <Field label="Support phone"><input value={draft.supportPhone} onChange={(event) => setDraft({ ...draft, supportPhone: event.target.value })} required /></Field>
          <Field label="Free shipping threshold (cents)">
            <input inputMode="numeric" value={draft.freeShippingThresholdCents} onChange={(event) => setDraft({ ...draft, freeShippingThresholdCents: event.target.value })} />
            {/^\d+$/.test(draft.freeShippingThresholdCents) ? <span className="note">{formatUsd(Number(draft.freeShippingThresholdCents))}</span> : null}
          </Field>
          <Field label="Cold pack surcharge (cents)">
            <input inputMode="numeric" value={draft.coldPackSurchargeCents} onChange={(event) => setDraft({ ...draft, coldPackSurchargeCents: event.target.value })} />
          </Field>
          <Field label="Tax flat rate (basis points)">
            <input inputMode="numeric" value={draft.taxFlatRateBps} onChange={(event) => setDraft({ ...draft, taxFlatRateBps: event.target.value })} />
            {/^\d+$/.test(draft.taxFlatRateBps) ? <span className="note">{formatBps(Number(draft.taxFlatRateBps))}</span> : null}
          </Field>
          <Field label="Announcement" wide><input value={draft.announcementBar} onChange={(event) => setDraft({ ...draft, announcementBar: event.target.value })} maxLength={240} /></Field>
          <Field label="Default meta title"><input value={draft.defaultMetaTitle} onChange={(event) => setDraft({ ...draft, defaultMetaTitle: event.target.value })} /></Field>
          <Field label="Default meta description"><input value={draft.defaultMetaDescription} onChange={(event) => setDraft({ ...draft, defaultMetaDescription: event.target.value })} /></Field>
          <Field label="Instagram"><input value={draft.instagram} onChange={(event) => setDraft({ ...draft, instagram: event.target.value })} placeholder="https://" /></Field>
          <Field label="Facebook"><input value={draft.facebook} onChange={(event) => setDraft({ ...draft, facebook: event.target.value })} placeholder="https://" /></Field>
          <Field label="TikTok"><input value={draft.tiktok} onChange={(event) => setDraft({ ...draft, tiktok: event.target.value })} placeholder="https://" /></Field>
          <Field label="YouTube"><input value={draft.youtube} onChange={(event) => setDraft({ ...draft, youtube: event.target.value })} placeholder="https://" /></Field>
        </div>
        {ZONES.map((zoneName) => (
          <fieldset key={zoneName}>
            <legend>{zoneName.replace('_', ' ')}</legend>
            {METHODS.map((method) => (
              <div className="form-grid" key={method}>
                <Field label={`${method} base cents`}><input inputMode="numeric" value={draft.rates[zoneName][method].baseCents} onChange={(event) => setRate(zoneName, method, 'baseCents', event.target.value)} /></Field>
                <Field label={`${method} per pound cents`}><input inputMode="numeric" value={draft.rates[zoneName][method].perPoundCents} onChange={(event) => setRate(zoneName, method, 'perPoundCents', event.target.value)} /></Field>
              </div>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={draft.rates[zoneName].overnight != null}
                onChange={(event) => setDraft({
                  ...draft,
                  rates: { ...draft.rates, [zoneName]: { ...draft.rates[zoneName], overnight: event.target.checked ? methodOr(draft.rates[zoneName].overnight) : null } },
                })}
              />
              Offer overnight
            </label>
            {draft.rates[zoneName].overnight ? (
              <div className="form-grid">
                <Field label="Overnight base cents">
                  <input inputMode="numeric" value={draft.rates[zoneName].overnight?.baseCents ?? 0} onChange={(event) => setDraft({
                    ...draft,
                    rates: { ...draft.rates, [zoneName]: { ...draft.rates[zoneName], overnight: { baseCents: Number(event.target.value || 0), perPoundCents: draft.rates[zoneName].overnight?.perPoundCents ?? 0 } } },
                  })} />
                </Field>
                <Field label="Overnight per pound cents">
                  <input inputMode="numeric" value={draft.rates[zoneName].overnight?.perPoundCents ?? 0} onChange={(event) => setDraft({
                    ...draft,
                    rates: { ...draft.rates, [zoneName]: { ...draft.rates[zoneName], overnight: { baseCents: draft.rates[zoneName].overnight?.baseCents ?? 0, perPoundCents: Number(event.target.value || 0) } } },
                  })} />
                </Field>
              </div>
            ) : null}
          </fieldset>
        ))}
        <button className="btn" disabled={pending} type="submit">{pending ? 'Saving…' : 'Save settings'}</button>
      </form>
    </>
  );
}
