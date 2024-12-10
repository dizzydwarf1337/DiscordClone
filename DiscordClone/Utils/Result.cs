using Microsoft.AspNetCore.Mvc;

namespace DiscordClone.Utils
{
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public string Message { get; }
        public T Data { get; }

        private Result(bool isSuccess, T data, string message)
        {
            IsSuccess = isSuccess;
            Data = data;
            Message = message;
        }

        public static Result<T> Success(T data) => new Result<T>(true, data, null);
        public static Result<T> Failure(string message) => new Result<T>(false, default, message);
    }
}