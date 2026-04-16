type CompanyLogoProps = {
  className?: string;
  imageClassName?: string;
};

export default function CompanyLogo({
  className = "",
  imageClassName = "",
}: CompanyLogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/webrigo%20logo.png"
        alt="Webrigo"
        className={`h-9 w-auto max-w-[9rem] object-contain sm:max-w-[11rem] ${imageClassName}`}
      />
    </span>
  );
}
