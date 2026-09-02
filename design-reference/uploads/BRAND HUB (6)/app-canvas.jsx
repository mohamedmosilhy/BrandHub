/* ───────────── BRANDHUB · App design canvas (assembly) ───────────── */

function AppDesignCanvas() {
  return (
    <DesignCanvas>
      <DCSection
        id="storefront-full"
        title="المتجر — التصميم الكامل (handoff)"
        subtitle="The complete storefront scroll at 402px — every section in order, plus developer notes. Click the artboard to inspect fullscreen."
      >
        <DCArtboard id="sf-full" label="Storefront · full scroll · 402w" width={402}>
          <StorefrontFull />
        </DCArtboard>
        <DCArtboard id="sf-notes" label="ملاحظات للمطوّر" width={320}>
          <DevNotes />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="option-b"
        title="في الجهاز — above the fold"
        subtitle="How the first viewport feels on each platform."
      >
        <DCArtboard id="b-ios" label="B · iOS" width={402} height={874}>
          <IOSDevice><HomeB platform="ios" /></IOSDevice>
        </DCArtboard>
        <DCArtboard id="b-android" label="B · Android" width={412} height={892}>
          <AndroidDevice><HomeB platform="android" /></AndroidDevice>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppDesignCanvas />);
