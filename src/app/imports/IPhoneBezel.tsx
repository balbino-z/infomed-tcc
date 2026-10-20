import imgIPhone16 from "figma:asset/110e89a881348c039db5211ca269bd480bacd45f.png";

export default function IPhoneBezel() {
  return (
    <div className="relative size-full" data-name="iPhone bezel">
      <div className="absolute h-[912px] left-[-30px] top-[-30px] w-[453px]" data-name="iPhone 16">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIPhone16} />
      </div>
    </div>
  );
}